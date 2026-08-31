"""Persisted self-assessment attempts for public MBTI and MI tools."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assessment_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    questionnaire_version: Mapped[str] = mapped_column(String(30), nullable=False)
    answers_json: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False)
    result_code: Mapped[str] = mapped_column(String(30), nullable=False)
    result_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (Index("ix_assessment_attempt_user_type", "user_id", "assessment_type"),)
