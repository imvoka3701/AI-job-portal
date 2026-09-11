"""UserFeedback model — captures suggestions, bug reports, and complaints from all user personas."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserFeedback(Base):
    """Stores user feedback, bug reports, feature suggestions, and job complaints."""

    __tablename__ = "user_feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_role: Mapped[str] = mapped_column(
        String(50), default="candidate", nullable=False, index=True
    )  # candidate, employer, guest
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sender_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    feedback_type: Mapped[str] = mapped_column(
        String(50), default="general", nullable=False, index=True
    )  # bug_report, feature_request, ai_experience, job_report, general
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1 to 5 stars
    target_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="new", nullable=False, index=True
    )  # new, in_progress, resolved, rejected
    priority: Mapped[str] = mapped_column(
        String(50), default="medium", nullable=False, index=True
    )  # low, medium, high, urgent
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_user_feedbacks_role_status", "user_role", "status"),
        Index("ix_user_feedbacks_type_priority", "feedback_type", "priority"),
    )

    def __repr__(self) -> str:
        return f"<UserFeedback #{self.id} [{self.user_role}] {self.title} ({self.status})>"
