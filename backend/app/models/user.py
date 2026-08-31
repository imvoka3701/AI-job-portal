"""User ORM model — supports Candidate, Employer, and Admin roles."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, pg_enum


class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, "userrole"), default=UserRole.CANDIDATE
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Employer-specific fields
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    company_description: Mapped[str | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    jobs: Mapped[list["Job"]] = relationship(back_populates="employer")  # type: ignore[name-defined]  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="candidate", foreign_keys="Application.candidate_id"
    )
    resumes: Mapped[list["Resume"]] = relationship(back_populates="user")  # type: ignore[name-defined]  # noqa: F821
    notifications: Mapped[list["Notification"]] = relationship()  # type: ignore[name-defined]  # noqa: F821
    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(back_populates="user")  # type: ignore[name-defined]  # noqa: F821
    cv_documents: Mapped[list["CvDocument"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
