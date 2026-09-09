"""B2B Direct Chat router — Real-time messaging between HR/Employers and Candidates."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.application import crud_application
from app.crud.chat import crud_chat
from app.database import get_db
from app.models.chat import ChatMessage, Conversation
from app.models.notification import NotificationType
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ConversationDetailOut,
    ConversationOut,
)
from app.services.notification_dispatcher import create_and_dispatch_notification
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Direct Chat"])


def _format_conversation_out(conv: Conversation, user_id: int, db: Session) -> dict[str, Any]:
    last_msg = conv.messages[-1].content if conv.messages else None
    unread_count = crud_chat.count_unread_for_user(db, conversation_id=conv.id, user_id=user_id)

    candidate_name = conv.candidate.full_name or conv.candidate.email if conv.candidate else None
    candidate_avatar = conv.candidate.avatar_url if conv.candidate else None
    job_title = conv.job.title if conv.job else None
    company_name = conv.company.name if conv.company else None

    return {
        "id": conv.id,
        "application_id": conv.application_id,
        "job_id": conv.job_id,
        "job_title": job_title,
        "candidate_id": conv.candidate_id,
        "candidate_name": candidate_name,
        "candidate_avatar": candidate_avatar,
        "company_id": conv.company_id,
        "company_name": company_name,
        "last_message": last_msg,
        "last_message_at": conv.last_message_at,
        "unread_count": unread_count,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
    }


def _format_message_out(msg: ChatMessage) -> dict[str, Any]:
    sender_name = msg.sender.full_name or msg.sender.email if msg.sender else None
    sender_role = (
        msg.sender.role.value
        if msg.sender and hasattr(msg.sender.role, "value")
        else str(msg.sender.role)
        if msg.sender
        else None
    )
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "content": msg.content,
        "is_read": msg.is_read,
        "read_at": msg.read_at,
        "created_at": msg.created_at,
    }


@router.get(
    "/conversations",
    response_model=list[ConversationOut],
    summary="Danh sách cuộc trò chuyện",
    description="Lấy danh sách các cuộc trò chuyện mà người dùng hiện tại có quyền tham gia.",
)
def list_conversations(
    company_id: int | None = Query(None, description="Lọc theo ID công ty (dành cho HR/Admin)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    conversations = crud_chat.list_conversations_for_user(
        db, user=current_user, company_id=company_id, skip=skip, limit=limit
    )
    return [_format_conversation_out(c, current_user.id, db) for c in conversations]


@router.post(
    "/applications/{application_id}/init",
    response_model=ConversationDetailOut,
    summary="Khởi tạo hoặc lấy cuộc trò chuyện cho đơn ứng tuyển",
    description="Lấy cuộc trò chuyện hiện tại hoặc tạo mới nếu chưa tồn tại cho đơn ứng tuyển.",
)
def init_application_conversation(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    app = crud_application.get_by_id(db, application_id=application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy hồ sơ ứng tuyển #{application_id}",
        )

    conv = crud_chat.get_or_create_conversation(db, application_id=application_id)
    if not crud_chat.user_has_access_to_conversation(db, conversation=conv, user=current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập vào cuộc trò chuyện này.",
        )

    # Automatically mark unread messages as read
    crud_chat.mark_messages_read(db, conversation_id=conv.id, reader_id=current_user.id)

    messages = crud_chat.get_messages(db, conversation_id=conv.id, skip=0, limit=100)
    data = _format_conversation_out(conv, current_user.id, db)
    data["messages"] = [_format_message_out(m) for m in messages]
    return data


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailOut,
    summary="Lấy chi tiết cuộc trò chuyện và lịch sử tin nhắn",
    description="Lấy chi tiết hội thoại kèm tin nhắn và tự động đánh dấu đã đọc.",
)
def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    conv = crud_chat.get_conversation_by_id(db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    if not crud_chat.user_has_access_to_conversation(db, conversation=conv, user=current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập cuộc trò chuyện này.",
        )

    # Automatically mark unread messages as read
    crud_chat.mark_messages_read(db, conversation_id=conv.id, reader_id=current_user.id)

    messages = crud_chat.get_messages(db, conversation_id=conv.id, skip=0, limit=100)
    data = _format_conversation_out(conv, current_user.id, db)
    data["messages"] = [_format_message_out(m) for m in messages]
    return data


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ChatMessageOut],
    summary="Lấy danh sách tin nhắn theo phân trang",
    description="Lấy danh sách tin nhắn của cuộc trò chuyện.",
)
def list_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    conv = crud_chat.get_conversation_by_id(db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    if not crud_chat.user_has_access_to_conversation(db, conversation=conv, user=current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xem tin nhắn cuộc trò chuyện này.",
        )

    messages = crud_chat.get_messages(db, conversation_id=conv.id, skip=skip, limit=limit)
    return [_format_message_out(m) for m in messages]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi tin nhắn mới",
    description="Gửi tin nhắn mới trong cuộc trò chuyện và thông báo thời gian thực tới người nhận.",
)
def send_message(
    conversation_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    conv = crud_chat.get_conversation_by_id(db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    if not crud_chat.user_has_access_to_conversation(db, conversation=conv, user=current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này.",
        )

    msg = crud_chat.create_message(
        db,
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=payload.content.strip(),
    )

    # Determine recipient
    # If sender is candidate -> recipient is employer / job owner
    # If sender is employer / company member -> recipient is candidate
    if current_user.id == conv.candidate_id:
        recipient_id = conv.job.employer_id if conv.job else None
    else:
        recipient_id = conv.candidate_id

    sender_display = current_user.full_name or current_user.email

    # 1. Real-time WebSocket push
    if recipient_id:
        ws_manager.notify_user_sync(
            user_id=recipient_id,
            payload={
                "type": "chat_message",
                "data": {
                    "id": msg.id,
                    "conversation_id": conv.id,
                    "application_id": conv.application_id,
                    "sender_id": current_user.id,
                    "sender_name": sender_display,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                },
            },
        )

        # 2. In-App Notification (Module 3.2)
        try:
            job_name = f" [{conv.job.title}]" if conv.job else ""
            create_and_dispatch_notification(
                db=db,
                user_id=recipient_id,
                title=f"Tin nhắn mới từ {sender_display}{job_name}",
                message=msg.content[:160] + ("..." if len(msg.content) > 160 else ""),
                notif_type=NotificationType.SYSTEM,
                extra_data={
                    "conversation_id": conv.id,
                    "application_id": conv.application_id,
                    "type": "direct_chat",
                },
            )
        except Exception as exc:
            logger.warning("Failed to create in-app notification for chat message: %s", exc)

    return _format_message_out(msg)


@router.patch(
    "/conversations/{conversation_id}/read",
    summary="Đánh dấu tất cả tin nhắn là đã đọc",
    description="Đánh dấu các tin nhắn chưa đọc đối phương gửi trong cuộc trò chuyện này là đã đọc.",
)
def mark_conversation_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    conv = crud_chat.get_conversation_by_id(db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cuộc trò chuyện #{conversation_id}",
        )

    if not crud_chat.user_has_access_to_conversation(db, conversation=conv, user=current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập cuộc trò chuyện này.",
        )

    count = crud_chat.mark_messages_read(db, conversation_id=conv.id, reader_id=current_user.id)
    return {"marked": count}
