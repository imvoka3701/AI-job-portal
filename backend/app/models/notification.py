"""Notification ORM model — in-app notifications for users."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, pg_enum


class NotificationType(str, enum.Enum):
    APPLICATION_UPDATE = "application_update"
    NEW_JOB_MATCH = "new_job_match"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        pg_enum(NotificationType, "notificationtype"), default=NotificationType.SYSTEM
    )
    is_read: Mapped[bool] = mapped_column(default=False)

    # Foreign key
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Notification {self.title} user={self.user_id}>"
