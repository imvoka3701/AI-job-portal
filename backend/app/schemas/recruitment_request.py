"""Validation contracts for department recruitment requests."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.job import JobType
from app.models.recruitment_request import (
    RecruitmentPriority,
    RecruitmentRequestStatus,
)


class RecruitmentRequestCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    headcount: int = Field(default=1, ge=1, le=100)
    job_type: JobType = JobType.FULL_TIME
    priority: RecruitmentPriority = RecruitmentPriority.NORMAL
    reason: str = Field(min_length=10, max_length=3000)
    responsibilities: str = Field(min_length=20, max_length=10000)
    requirements: str = Field(min_length=20, max_length=10000)
    target_start_date: date | None = None
    submit: bool = False


class RecruitmentRequestUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=255)
    headcount: int | None = Field(default=None, ge=1, le=100)
    job_type: JobType | None = None
    priority: RecruitmentPriority | None = None
    reason: str | None = Field(default=None, min_length=10, max_length=3000)
    responsibilities: str | None = Field(default=None, min_length=20, max_length=10000)
    requirements: str | None = Field(default=None, min_length=20, max_length=10000)
    target_start_date: date | None = None


class RecruitmentRequestReview(BaseModel):
    decision: RecruitmentRequestStatus
    note: str | None = Field(default=None, max_length=3000)

    @model_validator(mode="after")
    def validate_decision(self) -> "RecruitmentRequestReview":
        if self.decision not in {
            RecruitmentRequestStatus.APPROVED,
            RecruitmentRequestStatus.REJECTED,
        }:
            raise ValueError("Quyết định chỉ có thể là approved hoặc rejected.")
        if self.decision == RecruitmentRequestStatus.REJECTED and not self.note:
            raise ValueError("Cần ghi lý do khi từ chối yêu cầu.")
        return self


class RecruitmentRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    department_id: int
    department_name: str
    requested_by_id: int
    requester_name: str
    requester_email: str
    title: str
    headcount: int
    job_type: JobType
    priority: RecruitmentPriority
    reason: str
    responsibilities: str
    requirements: str
    target_start_date: date | None = None
    status: RecruitmentRequestStatus
    review_note: str | None = None
    reviewed_by_id: int | None = None
    reviewer_name: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    cancelled_at: datetime | None = None
    converted_job_id: int | None = None
    converted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class RecruitmentRequestPage(BaseModel):
    items: list[RecruitmentRequestRead]
    total: int
    page: int
    page_size: int
