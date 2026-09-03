"""Auth Pydantic schemas — Token, Login, Register."""

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int  # user id
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CANDIDATE
    company_name: str | None = None

    @field_validator("role")
    @classmethod
    def prevent_admin_registration(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Không thể tự đăng ký tài khoản Quản trị viên (Admin).")
        return v

