"""Department hiring-demand workflow before an HR job posting is created."""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, pg_enum
from app.models.job import JobType


class RecruitmentRequestStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class RecruitmentPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class RecruitmentRequest(Base):
    __tablename__ = "recruitment_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    requested_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    headcount: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    job_type: Mapped[JobType] = mapped_column(
        pg_enum(JobType, "jobtype"), nullable=False, default=JobType.FULL_TIME
    )
    priority: Mapped[RecruitmentPriority] = mapped_column(
        pg_enum(RecruitmentPriority, "recruitmentpriority"),
        nullable=False,
        default=RecruitmentPriority.NORMAL,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    responsibilities: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    target_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[RecruitmentRequestStatus] = mapped_column(
        pg_enum(RecruitmentRequestStatus, "recruitmentrequeststatus"),
        nullable=False,
        default=RecruitmentRequestStatus.DRAFT,
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_job_id: Mapped[int | None] = mapped_column(
        ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    department: Mapped["Department"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    requester: Mapped["User"] = relationship(foreign_keys=[requested_by_id])  # type: ignore[name-defined]  # noqa: F821
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_id])  # type: ignore[name-defined]  # noqa: F821
    converted_job: Mapped["Job | None"] = relationship(foreign_keys=[converted_job_id])

    __table_args__ = (
        Index(
            "ix_recruitment_request_company_status",
            "company_id",
            "status",
            "created_at",
        ),
        Index(
            "ix_recruitment_request_department_status",
            "department_id",
            "status",
            "created_at",
        ),
    )
