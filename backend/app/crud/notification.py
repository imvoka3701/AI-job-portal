"""CRUD operations for Notification model."""

from sqlalchemy import select, func, update
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


class CRUDNotification:
    def get_by_id(self, db: Session, *, notification_id: int) -> Notification | None:
        return db.get(Notification, notification_id)

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 20
    ) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    def get_unread_count(self, db: Session, *, user_id: int) -> int:
        stmt = select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        return db.execute(stmt).scalar() or 0

    def mark_read(self, db: Session, *, notification_id: int, user_id: int) -> Notification | None:
        notif = self.get_by_id(db, notification_id=notification_id)
        if notif and notif.user_id == user_id:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
            return notif
        return None

    def mark_all_read(self, db: Session, *, user_id: int) -> int:
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )
        result = db.execute(stmt)
        db.commit()
        return result.rowcount or 0

    def create(
        self,
        db: Session,
        *,
        user_id: int,
        title: str,
        message: str,
        type: NotificationType | None = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type or NotificationType.SYSTEM,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif


crud_notification = CRUDNotification()
