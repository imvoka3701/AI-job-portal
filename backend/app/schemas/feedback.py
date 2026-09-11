"""Pydantic schemas for User Feedback System."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class FeedbackCreate(BaseModel):
    """Schema for submitting user feedback (public or authenticated)."""

    sender_name: str = Field(..., min_length=2, max_length=255, description="Full name of sender")
    sender_email: EmailStr = Field(..., description="Contact email address")
    sender_phone: str | None = Field(None, max_length=50, description="Optional contact phone")
    feedback_type: Literal[
        "bug_report", "feature_request", "ai_experience", "job_report", "general"
    ] = Field("general", description="Category of feedback")
    title: str = Field(..., min_length=3, max_length=255, description="Brief summary / title")
    content: str = Field(..., min_length=10, description="Detailed explanation of feedback")
    rating: int | None = Field(None, ge=1, le=5, description="Satisfaction score 1-5 stars")
    target_id: str | None = Field(None, max_length=64, description="Optional ID of target entity")
    target_type: str | None = Field(None, max_length=50, description="Type of target (job, cv...)")


class FeedbackUpdateAdmin(BaseModel):
    """Schema for privileged admin updating feedback status, priority or responding."""

    status: Literal["new", "in_progress", "resolved", "rejected"] | None = None
    priority: Literal["low", "medium", "high", "urgent"] | None = None
    admin_notes: str | None = Field(None, description="Internal admin note")
    admin_response: str | None = Field(None, description="Resolution reply to user")


class FeedbackResponse(BaseModel):
    """Schema for returning feedback details."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    user_role: str
    sender_name: str
    sender_email: str
    sender_phone: str | None = None
    feedback_type: str
    title: str
    content: str
    rating: int | None = None
    target_id: str | None = None
    target_type: str | None = None
    status: str
    priority: str
    admin_notes: str | None = None
    admin_response: str | None = None
    resolved_by: int | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseModel):
    """Paginated feedback list response."""

    items: list[FeedbackResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FeedbackStatsResponse(BaseModel):
    """Aggregated feedback statistics for Admin Dashboard."""

    total_feedbacks: int
    pending_feedbacks: int
    in_progress_feedbacks: int
    resolved_feedbacks: int
    avg_csat_rating: float | None = None
    by_role: dict[str, int]
    by_type: dict[str, int]
