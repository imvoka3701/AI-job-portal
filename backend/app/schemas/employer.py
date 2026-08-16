"""Employer dashboard schemas."""

from datetime import datetime

from pydantic import BaseModel


class ApplicationOverTime(BaseModel):
    date: str
    count: int


class ActiveJobSummary(BaseModel):
    id: int
    title: str
    job_type: str
    experience_level: str
    location: str | None = None
    created_at: str
    applicant_count: int = 0
    avg_ai_match: float | None = None


class EmployerStatsResponse(BaseModel):
    total_jobs: int = 0
    total_applications: int = 0
    avg_ai_match: float | None = None
    applications_over_time: list[ApplicationOverTime] = []
    active_jobs: list[ActiveJobSummary] = []
    # 4.5.8 — extended analytics
    funnel: list[dict] = []
    time_to_hire_avg_days: float | None = None


class InterviewSummary(BaseModel):
    round_id: int
    application_id: int
    candidate_name: str
    candidate_email: str
    job_title: str
    round_number: int
    round_type: str
    round_name: str | None = None
    scheduled_at: str
    location: str | None = None
    status: str


class FunnelStep(BaseModel):
    round_type: str
    round_name: str
    entered: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    pending: int = 0
    pass_rate: float = 0.0


class EmployerAnalyticsResponse(BaseModel):
    funnel: list[FunnelStep] = []
    time_to_hire_avg_days: float | None = None
    total_applications: int = 0
