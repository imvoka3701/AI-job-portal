"""Admin dashboard schemas."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class AdminStats(BaseModel):
    total_candidates: int = 0
    total_employers: int = 0
    total_active_jobs: int = 0
    total_applications: int = 0
    new_users_last_30d: list[dict[str, int | str]] = []
    new_applications_last_30d: list[dict[str, int | str]] = []
    # 4.5.8 — extended analytics
    candidate_source_pct: dict[str, float] = {}
    funnel: list[dict] = []
    time_to_hire_avg_days: float | None = None


class CompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    company_name: str | None = None
    company_description: str | None = None
    is_active: bool
    created_at: datetime


class UserStatusUpdate(BaseModel):
    is_active: bool


class JobStatusUpdate(BaseModel):
    is_active: bool


class PaginatedResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int


class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    company_name: str | None = None
    created_at: datetime


class AdminJobSummary(BaseModel):
    id: int
    title: str
    job_type: str
    experience_level: str
    location: str | None = None
    is_active: bool
    employer_id: int
    company_name: str | None = None
    employer_email: str
    created_at: datetime


class AdminAuditLogSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int | None = None
    company_id: int | None = None
    actor_email: str
    action: str
    target_type: str
    target_id: str | None = None
    target_label: str | None = None
    details_json: dict[str, Any]
    created_at: datetime


# ── Interview Rounds Oversight Schemas ─────────────────────────────────────────

class InterviewRoundAdminItem(BaseModel):
    id: int
    application_id: int
    round_type: str
    round_name: str
    scheduled_at: datetime | None = None
    location: str | None = None
    interviewer_notes: str | None = None  # Read-only employer feedback/notes
    result: Literal["passed", "failed", "pending"] | None = None
    candidate_name: str
    candidate_email: str
    job_title: str
    company_name: str
    employer_email: str
    created_at: datetime
    needs_review: bool = False
    review_reason: str | None = None


class InterviewRoundMarkReviewRequest(BaseModel):
    needs_review: bool
    review_reason: str | None = Field(None, max_length=1000)


# ── System Alerts Schemas ──────────────────────────────────────────────────────

class StaleJobAlert(BaseModel):
    job_id: int
    title: str
    company_name: str
    days_inactive: int


class OverdueInterviewAlert(BaseModel):
    round_id: int
    candidate_name: str
    job_title: str
    company_name: str
    days_overdue: int


class PendingActionAlert(BaseModel):
    application_id: int
    candidate_name: str
    job_title: str
    company_name: str
    days_pending: int


class AdminAlertsSummary(BaseModel):
    ai_errors_24h: int = 0
    stale_jobs: list[StaleJobAlert] = []
    overdue_interviews: list[OverdueInterviewAlert] = []
    pending_actions: list[PendingActionAlert] = []
