"""Interview Rounds router — manage multi-stage recruitment pipeline."""

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.models.user import User, UserRole
from app.schemas.interview_round import RoundCreate, RoundRead, RoundUpdate

router = APIRouter(prefix="/applications", tags=["Interview Rounds"])


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
    return RoundRead.model_validate(updated)
