"""Application ORM model — tracks candidate applications to jobs."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, pg_enum


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class HiringRecommendation(str, enum.Enum):
    RECOMMENDED = "recommended"
    NOT_RECOMMENDED = "not_recommended"
    NEEDS_MORE_REVIEW = "needs_more_review"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        pg_enum(ApplicationStatus, "applicationstatus"), default=ApplicationStatus.PENDING
    )
    ai_matching_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    hiring_recommendation: Mapped[HiringRecommendation | None] = mapped_column(
        pg_enum(HiringRecommendation, "hiringrecommendation"), nullable=True
    )
    recommendation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    recommended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Foreign keys
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    resume_id: Mapped[int | None] = mapped_column(ForeignKey("resumes.id"), nullable=True)
    cv_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("cv_documents.id", ondelete="SET NULL"), nullable=True
    )

    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    candidate: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="applications", foreign_keys=[candidate_id]
    )
    job: Mapped["Job"] = relationship(back_populates="applications")  # type: ignore[name-defined]  # noqa: F821
    resume: Mapped["Resume | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    cv_document: Mapped["CvDocument | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    interview_rounds: Mapped[list["InterviewRound"]] = relationship(back_populates="application")  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<Application candidate={self.candidate_id} job={self.job_id} status={self.status.value}>"
