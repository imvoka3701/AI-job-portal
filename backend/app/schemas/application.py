"""Application Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel

from app.models.application import ApplicationStatus, HiringRecommendation
from app.schemas.cv_document import CvDocumentRead
from app.schemas.job import JobRead
from app.schemas.resume import ResumeRead
from app.schemas.user import UserRead


class ApplicationBase(BaseModel):
    cover_letter: str | None = None
    resume_id: int | None = None
    cv_document_id: int | None = None


class ApplicationCreate(ApplicationBase):
    job_id: int


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    decision_reason: str | None = None


class ApplicationRecommendationUpdate(BaseModel):
    recommendation: HiringRecommendation
    note: str | None = None


class ApplicationRead(ApplicationBase):
    id: int
    status: ApplicationStatus
    ai_matching_score: float | None = None
    ai_feedback: str | None = None
    candidate_id: int
    job_id: int
    job: JobRead | None = None
    applied_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployerApplicationRead(BaseModel):
    """Application detail for employer view — includes candidate info + AI score."""
    id: int
    status: ApplicationStatus
    ai_matching_score: float | None = None
    ai_feedback: str | None = None
    hiring_recommendation: HiringRecommendation | None = None
    recommendation_note: str | None = None
    recommendation_by_id: int | None = None
    recommended_at: datetime | None = None
    decision_by_id: int | None = None
    decided_at: datetime | None = None
    decision_reason: str | None = None
    candidate: UserRead | None = None
    job_id: int
    resume_id: int | None = None
    resume: ResumeRead | None = None
    cv_document_id: int | None = None
    cv_document: CvDocumentRead | None = None
    cover_letter: str | None = None
    applied_at: datetime

    model_config = {"from_attributes": True}
