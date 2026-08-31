"""Notifications router — in-app notification listing and management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.notification import crud_notification
from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationRead, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationRead], summary="Get my notifications")
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
) -> list[NotificationRead]:
    """List notifications for the current user, newest first."""
    notifs = crud_notification.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return [NotificationRead.model_validate(n) for n in notifs]


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    """Return the count of unread notifications for the current user."""
    count = crud_notification.get_unread_count(db, user_id=current_user.id)
    return UnreadCountResponse(count=count)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationRead,
    summary="Mark a notification as read",
)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationRead:
    """Mark a single notification as read."""
    notif = crud_notification.mark_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return NotificationRead.model_validate(notif)


@router.patch(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark all notifications as read",
)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Mark all notifications for the current user as read."""
    crud_notification.mark_all_read(db, user_id=current_user.id)
