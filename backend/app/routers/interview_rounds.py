"""Interview Rounds router — manage multi-stage recruitment pipeline."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    build_company_context,
    require_application_scope,
    require_company_permission,
)
from app.core.dependencies import get_current_user
from app.crud.application import crud_application
from app.crud.interview_round import crud_interview_round
from app.database import get_db
from app.models.interview_round import InterviewRound
from app.models.user import User, UserRole
from app.schemas.interview_round import RoundCreate, RoundRead, RoundUpdate
from app.services.calendar_service import generate_ics_calendar, get_calendar_links

router = APIRouter(prefix="/applications", tags=["Interview Rounds"])


def check_round_access(round_obj: InterviewRound, current_user: User, db: Session) -> None:
    """Ensure user has permission to view/download interview round calendar."""
    if current_user.role == UserRole.ADMIN:
        return
    app = round_obj.application
    if not app:
        raise HTTPException(status_code=404, detail="Application not found for this round")
    if current_user.role == UserRole.CANDIDATE:
        if app.candidate_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Bạn không có quyền truy cập lịch phỏng vấn này."
            )
        return
    if current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        require_application_scope(db, context=context, application=app)
        return
    raise HTTPException(status_code=403, detail="Quyền truy cập không hợp lệ.")


@router.get(
    "/{application_id}/rounds",
    response_model=list[RoundRead],
    summary="Get rounds for an application",
)
def get_rounds(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RoundRead]:
    """List all interview rounds for a specific application."""
    app = crud_application.get_by_id(db, application_id=application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.CANDIDATE:
        if app.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem các vòng này.")
    elif current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        require_application_scope(db, context=context, application=app)
    else:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem các vòng này.")
    rounds = crud_interview_round.get_by_application(db, application_id=application_id)
    return [RoundRead.model_validate(r) for r in rounds]


@router.post(
    "/{application_id}/rounds",
    response_model=RoundRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new round",
)
def create_round(
    application_id: int,
    data: RoundCreate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.INTERVIEW_MANAGE)
    ),
    db: Session = Depends(get_db),
) -> RoundRead:
    """Add a new interview round to an application."""
    app = crud_application.get_by_id(db, application_id=application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    require_application_scope(db, context=context, application=app)
    round_obj = crud_interview_round.create(
        db,
        application_id=application_id,
        round_type=data.round_type,
        round_name=data.round_name,
    )
    return RoundRead.model_validate(round_obj)


@router.patch(
    "/rounds/{round_id}",
    response_model=RoundRead,
    summary="Update a round (status, schedule, feedback)",
)
def update_round(
    round_id: int,
    data: RoundUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.INTERVIEW_EVALUATE)
    ),
    db: Session = Depends(get_db),
) -> RoundRead:
    """Update round details. Changing status auto-syncs back to Application.status."""
    round_obj = crud_interview_round.get_by_id(db, round_id=round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")
    require_application_scope(db, context=context, application=round_obj.application)
    scheduling_fields = {"scheduled_at", "location"}
    if data.model_fields_set & scheduling_fields and not context.has(
        CompanyPermission.INTERVIEW_MANAGE
    ):
        raise HTTPException(
            status_code=403,
            detail="Chỉ nhân sự được thay đổi lịch và địa điểm phỏng vấn.",
        )
    if data.model_fields_set & {"status", "feedback", "notes"}:
        round_obj.reviewer_id = context.user.id
    updated = crud_interview_round.update(
        db,
        db_obj=round_obj,
        data=data.model_dump(exclude_unset=True),
    )
    if data.feedback and round_obj.application:
        feedback_str = data.feedback.strip()
        round_name = round_obj.round_name or f"Vòng {round_obj.round_number}"
        note_entry = f"[{round_name}] {feedback_str}"
        current_feedback = round_obj.application.ai_feedback or ""
        if note_entry not in current_feedback:
            if current_feedback:
                round_obj.application.ai_feedback = f"{current_feedback}\n\n{note_entry}"
            else:
                round_obj.application.ai_feedback = note_entry
            db.commit()

    if "scheduled_at" in data.model_fields_set and round_obj.application and round_obj.scheduled_at:
        try:
            from app.models.notification import NotificationType
            from app.services.notification_dispatcher import create_and_dispatch_notification

            cand_id = round_obj.application.candidate_id
            job_title = round_obj.application.job.title if round_obj.application.job else "Công việc"
            round_label = round_obj.round_name or f"Vòng {round_obj.round_number}"
            time_str = round_obj.scheduled_at.strftime("%H:%M ngày %d/%m/%Y")
            create_and_dispatch_notification(
                db,
                user_id=cand_id,
                title="Lịch phỏng vấn mới",
                message=f'Bạn có lịch phỏng vấn {round_label} cho vị trí "{job_title}" lúc {time_str}.',
                notif_type=NotificationType.APPLICATION_UPDATE,
                extra_data={"round_id": round_obj.id, "application_id": round_obj.application_id},
            )
        except Exception:
            pass

    return RoundRead.model_validate(updated)


@router.get(
    "/rounds/{round_id}/calendar.ics",
    summary="Download RFC 5545 iCalendar (.ics) file for an interview round",
)
def download_round_ics(
    round_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Return an .ics file attachment for importing to Google, Apple, or Outlook Calendar."""
    round_obj = crud_interview_round.get_by_id(db, round_id=round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vòng phỏng vấn.")
    check_round_access(round_obj, current_user, db)
    if not round_obj.scheduled_at:
        raise HTTPException(
            status_code=400, detail="Vòng phỏng vấn này chưa được lên lịch thời gian."
        )

    ics_content = generate_ics_calendar(round_obj)
    return Response(
        content=ics_content,
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="interview_round_{round_id}.ics"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


@router.get(
    "/rounds/{round_id}/calendar-links",
    summary="Get 1-click calendar links for an interview round",
)
def get_round_calendar_links(
    round_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Return 1-click Google Calendar URL and ICS download path."""
    round_obj = crud_interview_round.get_by_id(db, round_id=round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vòng phỏng vấn.")
    check_round_access(round_obj, current_user, db)
    return get_calendar_links(round_obj)

