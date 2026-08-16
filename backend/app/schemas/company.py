"""Schemas for company tenancy and employer team management."""

from datetime import datetime

from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.company import (
    InvitationDeliveryStatus,
    InvitationStatus,
    MembershipRole,
    MembershipStatus,
)


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    logo_url: str | None = None
    is_active: bool


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=1000)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None


class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    name: str
    description: str | None = None
    is_active: bool


class MembershipRead(BaseModel):
    id: int
    company_id: int
    user_id: int
    full_name: str
    email: str
    avatar_url: str | None = None
    member_role: MembershipRole
    department_id: int | None = None
    department_name: str | None = None
    status: MembershipStatus
    is_owner: bool
    joined_at: datetime
    updated_at: datetime


class MembershipUpdate(BaseModel):
    member_role: MembershipRole | None = None
    department_id: int | None = None
    status: MembershipStatus | None = None

class CompanyContextRead(BaseModel):
    company: CompanyRead
    membership: MembershipRead
    permissions: list[str]
    departments: list[DepartmentRead]


class InvitationCreate(BaseModel):
    email: EmailStr
    member_role: MembershipRole
    department_id: int | None = None


class InvitationRead(BaseModel):
    id: int
    company_id: int
    company_name: str
    email: str
    member_role: MembershipRole
    department_id: int | None = None
    department_name: str | None = None
    status: InvitationStatus
    delivery_status: InvitationDeliveryStatus
    delivery_attempts: int
    message_id: str | None = None
    delivery_error: str | None = None
    sent_at: datetime | None = None
    bounced_at: datetime | None = None
    expires_at: datetime
    created_at: datetime


class InvitationCreated(InvitationRead):
    invite_token: str
    invite_path: str


class InvitationAccept(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class JobAssignmentsUpdate(BaseModel):
    membership_ids: list[int] = Field(default_factory=list, max_length=50)


class JobAssignmentRead(BaseModel):
    job_id: int
    membership_ids: list[int]


class JobAssignmentBatchItem(BaseModel):
    job_id: int = Field(gt=0)
    membership_ids: list[int] = Field(default_factory=list, max_length=50)


class JobAssignmentsBatchUpdate(BaseModel):
    assignments: list[JobAssignmentBatchItem] = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def validate_unique_jobs(self) -> "JobAssignmentsBatchUpdate":
        job_ids = [item.job_id for item in self.assignments]
        if len(job_ids) != len(set(job_ids)):
            raise ValueError("Mỗi job chỉ được xuất hiện một lần trong batch.")
        return self


class JobAssignmentsBatchRead(BaseModel):
    assignments: list[JobAssignmentRead]


class CompanyActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int | None = None
    actor_email: str
    action: str
    target_type: str
    target_id: str | None = None
    target_label: str | None = None
    details_json: dict[str, Any]
    created_at: datetime


class CompanyActivityPage(BaseModel):
    items: list[CompanyActivityRead]
    total: int
    page: int
    page_size: int


class InvitationBounceEvent(BaseModel):
    message_id: str = Field(min_length=3, max_length=255)
    reason: str | None = Field(default=None, max_length=2000)
