"""Admin router — system-wide management, interview oversight, and operations."""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.crud.admin import crud_admin
from app.crud.admin_audit_log import crud_admin_audit_log
from app.database import get_db
from app.models.interview_round import InterviewRound
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminAlertsSummary,
    AdminAuditLogSummary,
    AdminJobSummary,
    AdminStats,
    AdminUserSummary,
    CompanySummary,
    InterviewRoundAdminItem,
    InterviewRoundMarkReviewRequest,
    JobStatusUpdate,
    PaginatedResponse,
    UserStatusUpdate,
)
from app.services.admin_service import (
    permanently_delete_job,
    set_company_status,
    set_job_status,
    set_user_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# ── Helper ─────────────────────────────────────────────────────────────────────


def _require_admin(current_user: User = Depends(require_role(UserRole.ADMIN))) -> User:
    return current_user


def _format_round_item(r: InterviewRound) -> dict:
    cand = r.application.candidate if r.application and r.application.candidate else None
    job = r.application.job if r.application and r.application.job else None
    emp = job.employer if job and job.employer else None
    result_val = (
        "passed" if r.status == "passed" else ("failed" if r.status == "failed" else "pending")
    )
    return {
        "id": r.id,
        "application_id": r.application_id,
        "round_type": r.round_type,
        "round_name": r.round_name or f"Vòng {r.round_number}",
        "scheduled_at": r.scheduled_at,
        "location": r.location,
        "interviewer_notes": r.feedback or r.notes,  # Read-only employer feedback
        "result": result_val,
        "candidate_name": cand.full_name if cand else "N/A",
        "candidate_email": cand.email if cand else "N/A",
        "job_title": job.title if job else "N/A",
        "company_name": emp.company_name or emp.full_name if emp else "N/A",
        "employer_email": emp.email if emp else "N/A",
        "created_at": r.created_at,
        "needs_review": r.needs_review,
        "review_reason": r.review_reason,
    }


# ── Stats ──────────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=AdminStats, summary="System-wide statistics")
def get_admin_stats(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> AdminStats:
    """Aggregated stats for the admin dashboard."""
    total_candidates = (
        db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'candidate'")).scalar() or 0
    )
    total_employers = (
        db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'employer'")).scalar() or 0
    )
    total_active_jobs = (
        db.execute(text("SELECT COUNT(*) FROM jobs WHERE is_active = true")).scalar() or 0
    )
    total_applications = db.execute(text("SELECT COUNT(*) FROM applications")).scalar() or 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    new_users_rows = db.execute(
        text(
            "SELECT DATE(created_at) AS day, COUNT(*) AS cnt "
            "FROM users WHERE created_at >= :since "
            "GROUP BY DATE(created_at) ORDER BY day"
        ),
        {"since": thirty_days_ago},
    ).fetchall()
    new_users_last_30d = [{"date": str(r.day), "count": r.cnt} for r in new_users_rows]

    new_apps_rows = db.execute(
        text(
            "SELECT DATE(applied_at) AS day, COUNT(*) AS cnt "
            "FROM applications WHERE applied_at >= :since "
            "GROUP BY DATE(applied_at) ORDER BY day"
        ),
        {"since": thirty_days_ago},
    ).fetchall()
    new_applications_last_30d = [{"date": str(r.day), "count": r.cnt} for r in new_apps_rows]

    # ── 4.5.8: candidate source ──────────────────────────────────────────
    direct_count = (
        db.execute(
            text(
                "SELECT COUNT(*) FROM users WHERE role='candidate' AND id NOT IN (SELECT DISTINCT user_id FROM oauth_accounts)"
            )
        ).scalar()
        or 0
    )
    oauth_count = (
        db.execute(text("SELECT COUNT(*) FROM oauth_accounts WHERE provider='google'")).scalar()
        or 0
    )
    total_cand = total_candidates or 1
    candidate_source_pct = {
        "direct": round(direct_count / total_cand * 100, 1),
        "google_oauth": round(oauth_count / total_cand * 100, 1),
    }

    # ── 4.5.8: funnel (round pass rates) ─────────────────────────────────
    funnel_rows = db.execute(
        text(
            "SELECT ir.round_type, "
            "COUNT(*) AS entered, "
            "SUM(CASE WHEN ir.status='passed' THEN 1 ELSE 0 END) AS passed, "
            "SUM(CASE WHEN ir.status='failed' THEN 1 ELSE 0 END) AS failed, "
            "SUM(CASE WHEN ir.status='skipped' THEN 1 ELSE 0 END) AS skipped, "
            "SUM(CASE WHEN ir.status IN ('pending','in_progress') THEN 1 ELSE 0 END) AS pending "
            "FROM interview_rounds ir "
            "JOIN applications a ON ir.application_id = a.id "
            "GROUP BY ir.round_type ORDER BY ir.round_type"
        )
    ).fetchall()
    funnel = [
        {
            "round_type": r.round_type,
            "round_name": {
                "cv_screen": "Duyệt CV",
                "tech": "PV Kỹ thuật",
                "hr": "PV HR",
                "final": "Vòng cuối",
                "custom": "Khác",
            }.get(r.round_type, r.round_type),
            "entered": r.entered,
            "passed": r.passed,
            "failed": r.failed,
            "skipped": r.skipped,
            "pending": r.pending,
            "pass_rate": round(r.passed / r.entered * 100, 1) if r.entered > 0 else 0.0,
        }
        for r in funnel_rows
    ]

    # ── 4.5.8: time-to-hire avg ──────────────────────────────────────────
    try:
        tth_row = db.execute(
            text(
                "SELECT AVG(EXTRACT(EPOCH FROM (a.updated_at - a.applied_at)) / 86400) AS avg_days "
                "FROM applications a WHERE a.status = 'accepted'"
            )
        ).fetchone()
        time_to_hire_avg_days = (
            round(float(tth_row.avg_days), 1) if tth_row and tth_row.avg_days else None
        )
    except Exception:
        tth_row = db.execute(
            text(
                "SELECT AVG(julianday(a.updated_at) - julianday(a.applied_at)) AS avg_days "
                "FROM applications a WHERE a.status = 'accepted'"
            )
        ).fetchone()
        time_to_hire_avg_days = (
            round(float(tth_row.avg_days), 1) if tth_row and tth_row.avg_days else None
        )

    return AdminStats(
        total_candidates=total_candidates,
        total_employers=total_employers,
        total_active_jobs=total_active_jobs,
        total_applications=total_applications,
        new_users_last_30d=new_users_last_30d,
        new_applications_last_30d=new_applications_last_30d,
        candidate_source_pct=candidate_source_pct,
        funnel=funnel,
        time_to_hire_avg_days=time_to_hire_avg_days,
    )


# ── Alerts ─────────────────────────────────────────────────────────────────────


@router.get(
    "/alerts",
    response_model=AdminAlertsSummary,
    summary="Get operational system alerts for admin dashboard",
)
def get_system_alerts(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> AdminAlertsSummary:
    """Consolidated operational health and incident alerts."""
    alerts_data = crud_admin.get_system_alerts(db)
    return AdminAlertsSummary(**alerts_data)


# ── Companies (Employer accounts) ─────────────────────────────────────────────


@router.get("/companies", response_model=list[CompanySummary], summary="List employer accounts")
def list_companies(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    keyword: str | None = Query(None, max_length=100),
    is_active: bool | None = Query(None),
) -> list[CompanySummary]:
    """List all employer accounts, optionally filtered by active status."""
    companies = crud_admin.list_companies(
        db,
        keyword=keyword,
        is_active=is_active,
    )
    return [CompanySummary.model_validate(company) for company in companies]


@router.patch(
    "/companies/{company_id}/approve",
    response_model=CompanySummary,
    summary="Approve an employer account",
)
def approve_company(
    company_id: int,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> CompanySummary:
    """Activate an employer account."""
    company = set_company_status(
        db,
        company_id=company_id,
        is_active=True,
        actor=current_user,
    )
    return CompanySummary.model_validate(company)


@router.patch(
    "/companies/{company_id}/reject",
    response_model=CompanySummary,
    summary="Reject (deactivate) an employer account",
)
def reject_company(
    company_id: int,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> CompanySummary:
    """Deactivate an employer account."""
    company = set_company_status(
        db,
        company_id=company_id,
        is_active=False,
        actor=current_user,
    )
    return CompanySummary.model_validate(company)


# ── Jobs ───────────────────────────────────────────────────────────────────────


@router.get("/jobs", summary="List all jobs (admin)")
def list_all_jobs(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    keyword: str | None = Query(None),
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    """Paginated list of all jobs, with optional filters."""
    offset = (page - 1) * page_size
    jobs, total = crud_admin.list_jobs(
        db,
        keyword=keyword,
        is_active=is_active,
        skip=offset,
        limit=page_size,
    )

    return PaginatedResponse(
        items=[
            AdminJobSummary(
                id=job.id,
                title=job.title,
                job_type=job.job_type.value,
                experience_level=job.experience_level.value,
                location=job.location,
                is_active=job.is_active,
                employer_id=job.employer_id,
                company_name=job.employer.company_name,
                employer_email=job.employer.email,
                created_at=job.created_at,
            ).model_dump()
            for job in jobs
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/jobs/{job_id}/status",
    response_model=AdminJobSummary,
    summary="Activate or deactivate a job",
)
def update_job_status(
    job_id: int,
    data: JobStatusUpdate,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> AdminJobSummary:
    """Moderate a job without deleting its applications and interview history."""
    job = set_job_status(
        db,
        job_id=job_id,
        is_active=data.is_active,
        actor=current_user,
    )
    db.refresh(job, attribute_names=["employer"])
    return AdminJobSummary(
        id=job.id,
        title=job.title,
        job_type=job.job_type.value,
        experience_level=job.experience_level.value,
        location=job.location,
        is_active=job.is_active,
        employer_id=job.employer_id,
        company_name=job.employer.company_name,
        employer_email=job.employer.email,
        created_at=job.created_at,
    )


@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job (admin)",
)
def delete_job(
    job_id: int,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> None:
    """Permanently delete a job and dependent recruitment records (legacy API)."""
    permanently_delete_job(db, job_id=job_id, actor=current_user)


# ── Users ──────────────────────────────────────────────────────────────────────


@router.get("/users", summary="List all users (admin)")
def list_all_users(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    keyword: str | None = Query(None, max_length=100),
    role: UserRole | None = Query(None),
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    """Paginated list of all users, with optional filters."""
    offset = (page - 1) * page_size
    users, total = crud_admin.list_users(
        db,
        keyword=keyword,
        role=role,
        is_active=is_active,
        skip=offset,
        limit=page_size,
    )

    return PaginatedResponse(
        items=[AdminUserSummary.model_validate(user).model_dump() for user in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserSummary,
    summary="Toggle user active status",
)
def toggle_user_status(
    user_id: int,
    data: UserStatusUpdate,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> AdminUserSummary:
    """Activate or deactivate a user account."""
    updated = set_user_status(
        db,
        user_id=user_id,
        is_active=data.is_active,
        actor=current_user,
    )
    return AdminUserSummary.model_validate(updated)


@router.get(
    "/audit-logs",
    response_model=PaginatedResponse,
    summary="List administrator audit logs",
)
def list_audit_logs(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    action: str | None = Query(None, max_length=100),
    target_type: str | None = Query(None, max_length=50),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    """Return an immutable, newest-first trail of privileged mutations."""
    items, total = crud_admin_audit_log.get_list(
        db,
        action=action,
        target_type=target_type,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return PaginatedResponse(
        items=[AdminAuditLogSummary.model_validate(item).model_dump() for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ── Interview Rounds Oversight ─────────────────────────────────────────────────


@router.get(
    "/interview-rounds",
    response_model=PaginatedResponse,
    summary="List interview rounds across companies for governance oversight",
)
def list_interview_rounds(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    result: str | None = Query(None),
    round_type: str | None = Query(None),
    needs_review: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse:
    """Paginated interview rounds oversight with filters."""
    needs_rev = True if needs_review == "true" else (False if needs_review == "false" else None)
    rounds, total = crud_admin.list_interview_rounds(
        db,
        result=result,
        round_type=round_type,
        needs_review=needs_rev,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return PaginatedResponse(
        items=[_format_round_item(r) for r in rounds],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/interview-rounds/{round_id}/mark-review",
    response_model=InterviewRoundAdminItem,
    summary="Mark or clear review flag for an interview round",
)
def mark_interview_round_review(
    round_id: int,
    data: InterviewRoundMarkReviewRequest,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
) -> InterviewRoundAdminItem:
    """Mark an interview round as needing administrative review with reason."""
    round_obj = crud_admin.get_interview_round(db, round_id=round_id)
    if not round_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy vòng phỏng vấn.",
        )

    round_obj.needs_review = data.needs_review
    round_obj.review_reason = data.review_reason if data.needs_review else None
    round_obj.marked_by_admin_id = current_user.id if data.needs_review else None
    db.commit()
    db.refresh(round_obj)

    # Record immutable audit log
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        action="interview_round.mark_review"
        if data.needs_review
        else "interview_round.clear_review",
        target_type="interview_round",
        target_id=str(round_obj.id),
        target_label=f"{round_obj.round_name or f'Vòng {round_obj.round_number}'} (#{round_obj.id})",
        details={
            "needs_review": data.needs_review,
            "review_reason": data.review_reason,
            "application_id": round_obj.application_id,
        },
    )
    db.commit()

    return InterviewRoundAdminItem(**_format_round_item(round_obj))
