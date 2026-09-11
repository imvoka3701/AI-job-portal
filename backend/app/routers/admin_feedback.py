"""Admin User Feedback Moderation router."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.feedback import crud_feedback
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.feedback import (
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackStatsResponse,
    FeedbackUpdateAdmin,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/feedback", tags=["Admin Feedback Management"])


@router.get(
    "/stats",
    response_model=FeedbackStatsResponse,
    summary="Thống kê tổng quan Phản hồi người dùng",
    description="Lấy số liệu tổng hợp về tổng phản hồi, phản hồi chờ xử lý, điểm CSAT trung bình, phân bổ theo nhóm người dùng và loại phản hồi.",
)
def get_feedback_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    return crud_feedback.get_stats(db)


@router.get(
    "",
    response_model=FeedbackListResponse,
    summary="Danh sách Phản hồi Người dùng",
    description="Tra cứu danh sách phản hồi đa chiều kèm bộ lọc tệp người dùng, phân loại, trạng thái, độ ưu tiên.",
)
def list_feedbacks(
    user_role: str | None = Query(None, description="Lọc theo role: candidate, employer, guest"),
    feedback_type: str | None = Query(None, description="Lọc theo loại: bug_report, feature_request, ai_experience, job_report, general"),
    status: str | None = Query(None, description="Lọc theo trạng thái: new, in_progress, resolved, rejected"),
    priority: str | None = Query(None, description="Lọc theo mức ưu tiên: low, medium, high, urgent"),
    search: str | None = Query(None, description="Tìm kiếm theo tiêu đề, nội dung, tên hoặc email người gửi"),
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên một trang"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    skip = (page - 1) * page_size
    items, total = crud_feedback.list_feedbacks(
        db,
        user_role=user_role,
        feedback_type=feedback_type,
        status=status,
        priority=priority,
        search=search,
        skip=skip,
        limit=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse,
    summary="Chi tiết một phản hồi",
)
def get_feedback_detail(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    obj = crud_feedback.get_by_id(db, feedback_id=feedback_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy phản hồi #{feedback_id}.",
        )
    return obj


@router.patch(
    "/{feedback_id}",
    response_model=FeedbackResponse,
    summary="Cập nhật trạng thái / phản hồi giải pháp cho người dùng",
)
def update_feedback(
    feedback_id: int,
    data: FeedbackUpdateAdmin,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    obj = crud_feedback.get_by_id(db, feedback_id=feedback_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy phản hồi #{feedback_id}.",
        )

    old_status = obj.status
    updated = crud_feedback.update(
        db, feedback_obj=obj, data=data, admin_user_id=current_admin.id
    )

    # Log to audit trail
    try:
        crud_admin_audit_log.log_action(
            db,
            actor_user_id=current_admin.id,
            actor_email=current_admin.email,
            action="update_feedback",
            target_type="user_feedback",
            target_id=str(feedback_id),
            target_label=f"[{updated.user_role}] {updated.title[:50]}",
            details_json={
                "old_status": old_status,
                "new_status": updated.status,
                "priority": updated.priority,
                "admin_response_length": len(updated.admin_response or ""),
            },
        )
    except Exception as e:
        logger.warning("Failed to write audit log for feedback update: %s", e)

    return updated
