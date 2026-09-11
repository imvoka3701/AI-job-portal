"""Public & User Feedback submission router."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_optional_user
from app.crud.feedback import crud_feedback
from app.database import get_db
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["User Feedback"])


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi phản hồi / góp ý / báo cáo hệ thống",
    description="Cho phép Ứng viên, Nhà tuyển dụng hoặc Khách vãng lai gửi góp ý, báo lỗi, hoặc khiếu nại tin đăng.",
)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> Any:
    feedback_obj = crud_feedback.create(db, data=data, user=current_user)
    logger.info(
        "User feedback #%s submitted by %s (%s) [type=%s]",
        feedback_obj.id,
        feedback_obj.sender_email,
        feedback_obj.user_role,
        feedback_obj.feedback_type,
    )
    return feedback_obj
