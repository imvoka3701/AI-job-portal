"""Applications router — apply for jobs, manage applications."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    build_company_context,
    require_application_scope,
    require_company_permission,
    require_job_scope,
)
from app.core.dependencies import get_current_user, require_role
from app.crud.application import crud_application
from app.crud.cv_document import crud_cv_document
from app.crud.interview_round import crud_interview_round
from app.crud.job import crud_job
from app.crud.notification import crud_notification
from app.crud.resume import crud_resume
from app.database import get_db
from app.models.interview_round import RoundType
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationRecommendationUpdate,
    ApplicationUpdate,
    EmployerApplicationRead,
)
from app.services.ai_matching import ai_matching_service
from app.services.recruitment_pipeline_service import recruitment_pipeline_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a job",
)
def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> ApplicationRead:
    """Submit a job application. Notifies the employer."""
    if data.resume_id:
        resume = crud_resume.get_by_id(db, resume_id=data.resume_id)
        if not resume or resume.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if data.cv_document_id:
        cv_document = crud_cv_document.get_by_id(
            db, document_id=data.cv_document_id, user_id=current_user.id
        )
        if not cv_document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="CV Builder document not found"
            )

    application = crud_application.create(db, obj_in=data, candidate_id=current_user.id)

    # ── Auto-create Round 1 (CV Screen, pending) ────────────────────────────
    try:
        crud_interview_round.create(
            db,
            application_id=application.id,
            round_type=RoundType.CV_SCREEN.value,
            round_name="Vòng 1: Duyệt CV",
            round_number=1,
        )
    except Exception:
        logger.exception("Failed to create Round 1 for application %s", application.id)

    # ── Notify employer ────────────────────────────────────────────────────
    try:
        job = crud_job.get_by_id(db, job_id=application.job_id)
        if job:
            crud_notification.create(
                db,
                user_id=job.employer_id,
                title="Ứng viên mới ứng tuyển",
                message=(f'{current_user.full_name} đã ứng tuyển vào vị trí "{job.title}".'),
                type=NotificationType.APPLICATION_UPDATE,
            )
    except Exception:
        logger.exception(
            "Failed to create notification for employer %s", job.employer_id if job else "?"
        )

    return ApplicationRead.model_validate(application)


@router.get("/me", response_model=list[ApplicationRead], summary="My applications")
def get_my_applications(
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> list[ApplicationRead]:
    """List all applications submitted by the current user."""
    apps = crud_application.get_by_candidate(db, candidate_id=current_user.id)
    return [ApplicationRead.model_validate(a) for a in apps]


@router.get("/me/interviews", summary="Get my scheduled interviews")
def get_my_interviews(
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Scheduled interview rounds for the current candidate, soonest first."""
    from sqlalchemy import text as sa_text

    rows = db.execute(
        sa_text(
            "SELECT ir.id AS round_id, ir.scheduled_at, ir.location, ir.round_name, "
            "ir.round_type, ir.round_number, ir.status, "
            "j.title AS job_title, u.company_name "
            "FROM interview_rounds ir "
            "JOIN applications a ON ir.application_id = a.id "
            "JOIN jobs j ON a.job_id = j.id "
            "JOIN users u ON j.employer_id = u.id "
            "WHERE a.candidate_id = :cid AND ir.scheduled_at IS NOT NULL "
            "AND ir.scheduled_at >= CURRENT_TIMESTAMP "
            "ORDER BY ir.scheduled_at ASC LIMIT 5"
        ),
        {"cid": current_user.id},
    ).fetchall()
    import datetime as _dt

    return [
        {
            "round_id": r.round_id,
            "scheduled_at": r.scheduled_at.isoformat()
            if isinstance(r.scheduled_at, _dt.datetime)
            else str(r.scheduled_at)
            if r.scheduled_at
            else "",
            "location": r.location,
            "round_name": r.round_name or f"Vòng {r.round_number}",
            "round_type": r.round_type,
            "status": r.status,
            "job_title": r.job_title,
            "company_name": r.company_name,
        }
        for r in rows
    ]


@router.get("/{application_id}", response_model=ApplicationRead, summary="Get application details")
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationRead:
    """Get a single application by ID."""
    app = crud_application.get_by_id(db, application_id=application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if current_user.role == UserRole.CANDIDATE:
        if app.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem hồ sơ này.")
    elif current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        if not context.has(CompanyPermission.APPLICATION_VIEW):
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem hồ sơ này.")
        require_application_scope(db, context=context, application=app)
    else:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem hồ sơ này.")
    return ApplicationRead.model_validate(app)


@router.patch(
    "/{application_id}", response_model=EmployerApplicationRead, summary="Update application status"
)
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.PIPELINE_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> EmployerApplicationRead:
    """Update application status (Employer only). Notifies the candidate."""
    app = crud_application.get_by_id_with_relations(db, application_id=application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    require_application_scope(db, context=context, application=app)
    updated = recruitment_pipeline_service.update_status(
        db, application=app, data=data, actor=context.user
    )

    # ── Auto-sync to interview_rounds ────────────────────────────────────
    if data.status:
        from app.models.interview_round import RoundStatus

        new_status = data.status.value

        # Cleanup orphan rounds on terminal status
        crud_interview_round.cleanup_orphan_rounds(
            db,
            application_id=app.id,
            to_status=new_status,
        )

        # Create a synced round reflecting this status change
        round_type_map = {
            "reviewed": RoundType.CV_SCREEN.value,
            "shortlisted": RoundType.TECH_INTERVIEW.value,
            "interview": RoundType.TECH_INTERVIEW.value,
            "accepted": RoundType.FINAL.value,
            "rejected": RoundType.CUSTOM.value,
        }
        round_type = round_type_map.get(new_status, RoundType.CUSTOM.value)
        round_status: str | None = None
        if new_status == "accepted":
            round_status = RoundStatus.PASSED.value
        elif new_status == "rejected":
            round_status = RoundStatus.FAILED.value

        try:
            round_obj = crud_interview_round.create(
                db,
                application_id=app.id,
                round_type=round_type,
                round_name=f"Auto: {new_status}",
            )
            if round_status:
                round_obj.status = round_status
                db.commit()
        except Exception:
            logger.exception("Failed to sync round for application %s", app.id)

    # ── Notify candidate ──────────────────────────────────────────────────
    if data.status:
        status_labels: dict[str, str] = {
            "reviewed": "Đã xem hồ sơ",
            "shortlisted": "Được chọn vào vòng trong",
            "interview": "Được mời phỏng vấn",
            "accepted": "Trúng tuyển",
            "rejected": "Không phù hợp",
        }
        label = status_labels.get(data.status, f'cập nhật thành "{data.status}"')
        try:
            job = crud_job.get_by_id(db, job_id=app.job_id)
            crud_notification.create(
                db,
                user_id=app.candidate_id,
                title="Cập nhật trạng thái ứng tuyển",
                message=(
                    f'Đơn ứng tuyển "{job.title if job else f"Job #{app.job_id}"}" '
                    f"của bạn đã được cập nhật: {label}."
                ),
                type=NotificationType.APPLICATION_UPDATE,
            )
        except Exception:
            logger.exception("Failed to notify candidate %s", app.candidate_id)

    return EmployerApplicationRead.model_validate(updated)


@router.put(
    "/{application_id}/recommendation",
    response_model=EmployerApplicationRead,
    summary="Record department head hiring recommendation",
)
def update_recommendation(
    application_id: int,
    data: ApplicationRecommendationUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.CANDIDATE_RECOMMEND)
    ),
    db: Session = Depends(get_db),
) -> EmployerApplicationRead:
    app = crud_application.get_by_id_with_relations(db, application_id=application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    require_application_scope(db, context=context, application=app)
    updated = recruitment_pipeline_service.update_recommendation(
        db,
        application=app,
        recommendation=data.recommendation,
        note=data.note,
        actor=context.user,
    )
    return EmployerApplicationRead.model_validate(updated)


@router.get(
    "/employer/jobs/{job_id}",
    response_model=list[EmployerApplicationRead],
    summary="List applications for employer's job with AI match scores",
)
async def get_applications_for_employer_job(
    job_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.APPLICATION_VIEW)
    ),
    db: Session = Depends(get_db),
) -> list[EmployerApplicationRead]:
    """Get all applications for a specific job owned by the employer.

    AI matching scores are computed on-the-fly by comparing each
    applicant's resume embedding against the job embedding.
    Applications returned in descending order by match score.
    """
    # Verify the job exists and belongs to this employer
    job = crud_job.get_by_id(db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    require_job_scope(db, context=context, job=job)

    applications = crud_application.get_by_job_with_candidates(db, job_id=job_id)

    # Compute AI match scores on-the-fly for each application with a resume
    results: list[EmployerApplicationRead] = []
    for app in applications:
        score: float | None = None
        if (
            job.embedding is not None
            and app.resume is not None
            and app.resume.embedding is not None
        ):
            try:
                match = await ai_matching_service.compute_match(
                    db,
                    resume=app.resume,
                    job_embedding=job.embedding,  # type: ignore[arg-type]
                )
                score = match.score
            except Exception:
                logger.exception("Failed to compute AI match for application %s", app.id)
                score = None

        results.append(
            EmployerApplicationRead(
                id=app.id,
                status=app.status,
                ai_matching_score=score,
                ai_feedback=app.ai_feedback,
                hiring_recommendation=app.hiring_recommendation,
                recommendation_note=app.recommendation_note,
                recommendation_by_id=app.recommendation_by_id,
                recommended_at=app.recommended_at,
                decision_by_id=app.decision_by_id,
                decided_at=app.decided_at,
                decision_reason=app.decision_reason,
                candidate=app.candidate,  # type: ignore[arg-type]
                job_id=app.job_id,
                resume_id=app.resume_id,
                resume=app.resume,
                cv_document_id=app.cv_document_id,
                cv_document=app.cv_document,
                cover_letter=app.cover_letter,
                applied_at=app.applied_at,
            )
        )

    # Sort by score descending (None sorts last)
    results.sort(
        key=lambda r: (r.ai_matching_score is None, r.ai_matching_score or 0), reverse=True
    )
    return results
