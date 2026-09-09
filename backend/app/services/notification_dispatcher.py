"""Notification Dispatcher: Save notification to DB and broadcast over WebSocket in real-time."""

from typing import Any

from sqlalchemy.orm import Session

from app.crud.notification import crud_notification
from app.models.notification import Notification, NotificationType
from app.services.websocket_manager import ws_manager


def create_and_dispatch_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: NotificationType = NotificationType.SYSTEM,
    extra_data: dict[str, Any] | None = None,
) -> Notification:
    """Create a persistent notification in DB and dispatch it over WebSocket."""
    notif = crud_notification.create(
        db,
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
    )

    type_str = notif.type.value if hasattr(notif.type, "value") else str(notif.type)

    ws_manager.notify_user_sync(
        user_id=user_id,
        payload={
            "type": "notification",
            "data": {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "notif_type": type_str,
                "is_read": notif.is_read,
                "created_at": notif.created_at.isoformat() if notif.created_at else None,
                "extra_data": extra_data or {},
            },
        },
    )
    return notif
