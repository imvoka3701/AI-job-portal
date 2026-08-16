"""InterviewRound model — individual rounds in a multi-stage recruitment pipeline."""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RoundType(str, enum.Enum):
    CV_SCREEN = "cv_screen"       # Vòng 1: Duyệt CV
    TECH_INTERVIEW = "tech"       # Phỏng vấn kỹ thuật
    HR_INTERVIEW = "hr"           # Phỏng vấn HR / văn hóa
    FINAL = "final"               # Thương lượng offer
    CUSTOM = "custom"             # Vòng tùy chỉnh


class RoundStatus(str, enum.Enum):
    PENDING = "pending"           # Chưa bắt đầu
    IN_PROGRESS = "in_progress"   # Đang chờ phản hồi
    PASSED = "passed"             # Ứng viên qua vòng
    FAILED = "failed"             # Ứng viên rớt
    SKIPPED = "skipped"           # Bỏ qua vòng này


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True,
    )

    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    round_type: Mapped[str] = mapped_column(String(50), nullable=False, default=RoundType.CUSTOM.value)
    round_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default=RoundStatus.PENDING.value, server_default="pending")

    # Schedule (for 4.5.6)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Feedback
    reviewer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Admin Oversight & Governance (Phase 5 / Admin Oversight)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False, index=True)
    review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    marked_by_admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    application: Mapped["Application"] = relationship(back_populates="interview_rounds")  # type: ignore[name-defined]  # noqa: F821
    criteria_scores: Mapped[list["CriteriaScore"]] = relationship(back_populates="round")  # type: ignore[name-defined]  # noqa: F821
    marked_by_admin: Mapped["User | None"] = relationship("User", foreign_keys=[marked_by_admin_id])  # type: ignore[name-defined]  # noqa: F821

    __table_args__ = (
        Index("ix_interview_rounds_review_status", "needs_review", "round_type", "status"),
        Index("ix_interview_rounds_overdue", "status", "scheduled_at"),
    )

    def __repr__(self) -> str:
        return f"<InterviewRound #{self.round_number} ({self.round_type}) app={self.application_id} status={self.status} needs_review={self.needs_review}>"
