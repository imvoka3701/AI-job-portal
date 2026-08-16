"""Job Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel

from app.models.job import ExperienceLevel, JobType
from app.schemas.user import UserRead


class JobBase(BaseModel):
    title: str
    description: str
    requirements: str | None = None
    benefits: str | None = None
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.FRESHER
    salary_min: int | None = None
    salary_max: int | None = None
    location: str | None = None
    category_id: int | None = None
    department_id: int | None = None


class JobCreate(JobBase):
    recruitment_request_id: int | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    benefits: str | None = None
    job_type: JobType | None = None
    experience_level: ExperienceLevel | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    location: str | None = None
    category_id: int | None = None
    department_id: int | None = None
    is_active: bool | None = None


class JobRead(JobBase):
    id: int
    is_active: bool
    employer_id: int
    company_id: int | None = None
    employer: UserRead | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: list[JobRead]
    total: int
    page: int
    page_size: int
