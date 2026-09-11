"""Admin Chat Governance router — Metadata monitoring and moderation.

Zero-Knowledge Privacy:
Admin can observe conversation metadata (counts, timestamps, flags, participants),
manage violation reports, and lock abusive conversations.
Under NO circumstances is `ChatMessage.content` queried or returned to Admin.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.chat import crud_chat
from app.database import get_db
from app.models.chat import Conversation
from app.models.user import User
from app.schemas.chat import (
    AdminChatStatsOut,
    AdminConversationListResponse,
    AdminLockConversationRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/chat", tags=["Admin Chat Governance"])


@router.get(
    "/stats",
    response_model=AdminChatStatsOut,
    summary="Thống kê tổng quan Direct Chat",
    description="Lấy chỉ số tổng hợp về số hội thoại, số tin nhắn, phòng chat vi phạm và bị khóa.",
)
def get_chat_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("chat:read")),
) -> Any:
    stats = crud_chat.get_chat_stats_for_admin(db)
    return stats


@router.get(
    "/conversations",
    response_model=AdminConversationListResponse,
    summary="Danh sách phòng chat cho Quản trị viên (Metadata Only)",
    description="Danh sách hội thoại kèm bộ lọc vi phạm, trạng thái khóa và tìm kiếm. Tuyệt đối không chứa nội dung tin nhắn.",
)
def list_conversations_for_admin(
    is_reported: bool | None = Query(None, description="Lọc theo cờ báo cáo vi phạm"),
    is_locked: bool | None = Query(None, description="Lọc theo trạng thái đã bị khóa"),
    search: str | None = Query(None, description="Tìm kiếm theo tên ứng viên, email, công ty, tiêu đề việc làm"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("chat:read")),
) -> Any:
    items, total = crud_chat.list_conversations_for_admin(
        db,
        is_reported=is_reported,
        is_locked=is_locked,
        search=search,
        skip=skip,
        limit=limit,
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post(
    "/conversations/{conversation_id}/lock",
    response_model=dict[str, Any],
    summary="Khóa hoặc mở khóa cuộc trò chuyện",
    description="Admin can thiệp khóa phòng chat nếu phát hiện gian lận/quấy rối hoặc mở khóa sau khi giải quyết.",
)
def toggle_lock_conversation(
    conversation_id: int,
    payload: AdminLockConversationRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("chat:moderate")),
) -> Any:
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    updated_conv = crud_chat.lock_conversation(db, conversation_id=conv.id, is_locked=payload.is_locked)

    action_name = "CHAT_LOCK" if payload.is_locked else "CHAT_UNLOCK"
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        company_id=conv.company_id,
        action=action_name,
        target_type="conversation",
        target_id=str(conv.id),
        target_label=f"Conversation #{conv.id} (Job #{conv.job_id})",
        details={
            "is_locked": payload.is_locked,
            "reason": payload.reason,
            "candidate_id": conv.candidate_id,
        },
    )
    db.commit()

    logger.info(
        "Admin %s (%s) %s conversation #%d. Reason: %s",
        current_admin.email,
        current_admin.id,
        action_name,
        conv.id,
        payload.reason,
    )

    return {
        "message": f"Đã {'khóa' if payload.is_locked else 'mở khóa'} cuộc trò chuyện #{conv.id} thành công.",
        "conversation_id": updated_conv.id,
        "is_locked": updated_conv.is_locked,
    }


@router.post(
    "/conversations/{conversation_id}/dismiss-report",
    response_model=dict[str, Any],
    summary="Hủy bỏ cảnh báo vi phạm",
    description="Admin gỡ bỏ cờ báo cáo sau khi xác minh phòng chat không vi phạm tiêu chuẩn cộng đồng.",
)
def dismiss_conversation_report(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("chat:moderate")),
) -> Any:
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    updated_conv = crud_chat.dismiss_report(db, conversation_id=conv.id)

    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        company_id=conv.company_id,
        action="CHAT_DISMISS_REPORT",
        target_type="conversation",
        target_id=str(conv.id),
        target_label=f"Conversation #{conv.id}",
        details={"dismissed_by": current_admin.email},
    )
    db.commit()

    logger.info(
        "Admin %s dismissed violation report on conversation #%d",
        current_admin.email,
        conv.id,
    )

    return {
        "message": f"Đã gỡ bỏ cờ báo cáo vi phạm cho cuộc trò chuyện #{conv.id}.",
        "conversation_id": updated_conv.id,
        "is_reported": updated_conv.is_reported,
    }
