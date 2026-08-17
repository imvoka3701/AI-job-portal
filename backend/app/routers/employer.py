"""Employer router — stats, dashboard aggregations."""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    require_company_permission,
)
from app.crud.job import crud_job
from app.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.company import MembershipRole
from app.schemas.employer import (
    EmployerStatsResponse,
    ActiveJobSummary,
    InterviewSummary,
    EmployerAnalyticsResponse,
    FunnelStep,
    CompanySettingsRead,
    CompanySettingsUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employer", tags=["Employer"])


def _job_scope(context: CompanyContext) -> tuple[str, dict[str, int | None]]:
    params: dict[str, int | None] = {"company_id": context.company.id}
    clause = "j.company_id = :company_id"
    if context.membership.is_owner or context.membership.member_role == MembershipRole.HR:
        return clause, params
    params.update(
        department_id=context.membership.department_id,
        membership_id=context.membership.id,
    )
    clause += (
        " AND (j.department_id = :department_id OR EXISTS ("
        "SELECT 1 FROM job_assignments ja "
        "WHERE ja.job_id = j.id AND ja.membership_id = :membership_id))"
    )
    return clause, params


@router.get(
    "/stats",
    response_model=EmployerStatsResponse,
    summary="Get employer dashboard statistics",
)
def get_employer_stats(
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.ANALYTICS_VIEW)
    ),
    db: Session = Depends(get_db),
) -> EmployerStatsResponse:
    """Aggregated KPIs for the employer dashboard."""
    scope_clause, scope_params = _job_scope(context)

    # ── Total jobs ─────────────────────────────────────────────────────────
    total_jobs = db.execute(
        text(f"SELECT COUNT(*) FROM jobs j WHERE {scope_clause}"),
        scope_params,
    ).scalar() or 0

    # ── Total applications across all jobs ─────────────────────────────────
    total_apps = db.execute(
        text(
            "SELECT COUNT(*) FROM applications a "
            "JOIN jobs j ON a.job_id = j.id "
            f"WHERE {scope_clause}"
        ),
        scope_params,
    ).scalar() or 0

    # ── Average AI match score ─────────────────────────────────────────────
    avg_score_row = db.execute(
        text(
            "SELECT AVG(a.ai_matching_score) FROM applications a "
            "JOIN jobs j ON a.job_id = j.id "
            f"WHERE {scope_clause} AND a.ai_matching_score IS NOT NULL"
        ),
        scope_params,
    ).fetchone()
    avg_ai_match: float | None = round(float(avg_score_row[0]), 1) if avg_score_row and avg_score_row[0] is not None else None

    # ── Applications over time (last 30 days) ──────────────────────────────
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    rows = db.execute(
        text(
            "SELECT DATE(a.applied_at) AS day, COUNT(*) AS cnt "
            "FROM applications a "
            "JOIN jobs j ON a.job_id = j.id "
            f"WHERE {scope_clause} AND a.applied_at >= :since "
            "GROUP BY DATE(a.applied_at) "
            "ORDER BY day"
        ),
        {**scope_params, "since": thirty_days_ago},
    ).fetchall()
    applications_over_time = [
        {"date": str(row.day), "count": row.cnt} for row in rows
    ]

    # ── Active jobs with applicant count & avg AI score ────────────────────
    job_rows = db.execute(
        text(
            "SELECT j.id, j.title, j.job_type, j.experience_level, j.location, j.created_at, "
            "       COUNT(a.id) AS applicant_count, "
            "       ROUND(AVG(CAST(a.ai_matching_score AS NUMERIC)), 1) AS avg_score "
            "FROM jobs j "
            "LEFT JOIN applications a ON a.job_id = j.id "
            f"WHERE {scope_clause} AND j.is_active = true "
            "GROUP BY j.id "
            "ORDER BY j.created_at DESC"
        ),
        scope_params,
    ).fetchall()

    active_jobs = [
        ActiveJobSummary(
            id=row.id,
            title=row.title,
            job_type=row.job_type,
            experience_level=row.experience_level,
            location=row.location,
            created_at=row.created_at.isoformat() if hasattr(row.created_at, 'isoformat') else str(row.created_at or ''),
            applicant_count=row.applicant_count or 0,
            avg_ai_match=float(row.avg_score) if row.avg_score is not None else None,
        )
        for row in job_rows
    ]

    # ── 4.5.8: funnel (round pass rates for this employer) ──────────────
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
            "JOIN jobs j ON a.job_id = j.id "
            f"WHERE {scope_clause} "
            "GROUP BY ir.round_type ORDER BY ir.round_type"
        ),
        scope_params,
    ).fetchall()
    funnel = [
        {
            "round_type": r.round_type,
            "round_name": {"cv_screen": "Duyệt CV", "tech": "PV Kỹ thuật", "hr": "PV HR", "final": "Vòng cuối", "custom": "Khác"}.get(r.round_type, r.round_type),
            "entered": r.entered,
            "passed": r.passed,
            "failed": r.failed,
            "skipped": r.skipped,
            "pending": r.pending,
            "pass_rate": round(r.passed / r.entered * 100, 1) if r.entered > 0 else 0.0,
        }
        for r in funnel_rows
    ]

    # ── 4.5.8: time-to-hire avg for employer ─────────────────────────────
    try:
        tth_row = db.execute(
            text(
                "SELECT AVG(EXTRACT(EPOCH FROM (a.updated_at - a.applied_at)) / 86400) AS avg_days "
                "FROM applications a JOIN jobs j ON a.job_id = j.id "
                f"WHERE a.status = 'accepted' AND {scope_clause}"
            ),
            scope_params,
        ).fetchone()
        time_to_hire_avg_days = round(float(tth_row.avg_days), 1) if tth_row and tth_row.avg_days else None
    except Exception:
        # SQLite fallback — use julianday()
        tth_row = db.execute(
            text(
                "SELECT AVG(julianday(a.updated_at) - julianday(a.applied_at)) AS avg_days "
                "FROM applications a JOIN jobs j ON a.job_id = j.id "
                f"WHERE a.status = 'accepted' AND {scope_clause}"
            ),
            scope_params,
        ).fetchone()
        time_to_hire_avg_days = round(float(tth_row.avg_days), 1) if tth_row and tth_row.avg_days else None

    return EmployerStatsResponse(
        total_jobs=total_jobs,
        total_applications=total_apps,
        avg_ai_match=avg_ai_match,
        applications_over_time=applications_over_time,
        active_jobs=active_jobs,
        funnel=funnel,
        time_to_hire_avg_days=time_to_hire_avg_days,
    )


@router.get(
    "/interviews",
    response_model=list[InterviewSummary],
    summary="Get upcoming interviews (rounds with scheduled_at)",
)
def get_interviews(
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.APPLICATION_VIEW)
    ),
    db: Session = Depends(get_db),
) -> list[InterviewSummary]:
    """Scheduled interview rounds for employer's jobs, sorted soonest first."""
    scope_clause, scope_params = _job_scope(context)
    rows = db.execute(
        text(
            "SELECT ir.id AS round_id, ir.application_id, ir.round_number, ir.round_type, "
            "ir.round_name, ir.scheduled_at, ir.location, ir.status, "
            "u.full_name AS candidate_name, u.email AS candidate_email, "
            "j.title AS job_title "
            "FROM interview_rounds ir "
            "JOIN applications a ON ir.application_id = a.id "
            "JOIN jobs j ON a.job_id = j.id "
            "JOIN users u ON a.candidate_id = u.id "
            f"WHERE {scope_clause} AND ir.scheduled_at IS NOT NULL "
            "ORDER BY ir.scheduled_at ASC"
        ),
        scope_params,
    ).fetchall()

    import datetime as _dt
    return [
        InterviewSummary(
            round_id=r.round_id,
            application_id=r.application_id,
            candidate_name=r.candidate_name,
            candidate_email=r.candidate_email,
            job_title=r.job_title,
            round_number=r.round_number,
            round_type=r.round_type,
            round_name=r.round_name,
            scheduled_at=r.scheduled_at.isoformat() if isinstance(r.scheduled_at, _dt.datetime) else str(r.scheduled_at) if r.scheduled_at else "",
            location=r.location,
            status=r.status,
        )
        for r in rows
    ]


# ── Employer Settings ─────────────────────────────────────────────────────────


@router.get(
    "/settings",
    response_model=CompanySettingsRead,
    summary="Get company profile settings",
)
def get_company_settings(
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.ANALYTICS_VIEW)
    ),
) -> CompanySettingsRead:
    """Return the current company profile for the employer settings page."""
    return CompanySettingsRead.model_validate(context.company)


@router.patch(
    "/settings",
    response_model=CompanySettingsRead,
    summary="Update company profile settings",
)
def update_company_settings(
    data: CompanySettingsUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.TEAM_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> CompanySettingsRead:
    """Update company profile fields. Only owners / HR can update."""
    company = context.company
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có trường nào để cập nhật.",
        )
    for field, value in update_data.items():
        setattr(company, field, value)
    db.add(company)
    db.commit()
    db.refresh(company)
    return CompanySettingsRead.model_validate(company)
