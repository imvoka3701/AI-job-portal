"""User Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CANDIDATE
    company_name: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None
    company_description: str | None = None


class UserRead(UserBase):
    id: int
    role: UserRole
    avatar_url: str | None = None
    is_active: bool
    company_name: str | None = None
    company_logo_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
