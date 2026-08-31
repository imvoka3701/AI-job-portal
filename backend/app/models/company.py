"""Company tenancy, internal employer roles, invitations, and job assignments."""

import enum
from datetime import datetime

from sqlalchemy import JSON as GenericJSON
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, pg_enum


class MembershipRole(str, enum.Enum):
    HR = "hr"
    DEPARTMENT_HEAD = "department_head"


class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    REVOKED = "revoked"
    EXPIRED = "expired"


class InvitationDeliveryStatus(str, enum.Enum):
    NOT_CONFIGURED = "not_configured"
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(100), nullable=True)
    social_links: Mapped[dict | None] = mapped_column(GenericJSON, nullable=True)
    contact_person_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    memberships: Mapped[list["CompanyMembership"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    departments: Mapped[list["Department"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    company: Mapped[Company] = relationship(back_populates="departments")

    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_department_company_name"),
    )


class CompanyMembership(Base):
    __tablename__ = "company_memberships"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    member_role: Mapped[MembershipRole] = mapped_column(
        pg_enum(MembershipRole, "membershiprole"), nullable=False
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[MembershipStatus] = mapped_column(
        pg_enum(MembershipStatus, "membershipstatus"),
        default=MembershipStatus.ACTIVE,
        nullable=False,
    )
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    invited_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    membership_version: Mapped[int] = mapped_column(default=1, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    company: Mapped[Company] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]  # noqa: F821
    department: Mapped[Department | None] = relationship()

    __table_args__ = (
        UniqueConstraint("company_id", "user_id", name="uq_company_membership_user"),
        Index("ix_company_membership_scope", "company_id", "department_id", "member_role", "status"),
    )


class CompanyInvitation(Base):
    __tablename__ = "company_invitations"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    member_role: Mapped[MembershipRole] = mapped_column(
        pg_enum(MembershipRole, "membershiprole"), nullable=False
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[InvitationStatus] = mapped_column(
        pg_enum(InvitationStatus, "invitationstatus"),
        default=InvitationStatus.PENDING,
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    invited_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_status: Mapped[InvitationDeliveryStatus] = mapped_column(
        pg_enum(InvitationDeliveryStatus, "invitationdeliverystatus"),
        default=InvitationDeliveryStatus.NOT_CONFIGURED,
        nullable=False,
    )
    delivery_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    delivery_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    bounced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    company: Mapped[Company] = relationship()
    department: Mapped[Department | None] = relationship()

    __table_args__ = (
        Index("ix_company_invitation_lookup", "company_id", "email", "status"),
    )


class JobAssignment(Base):
    __tablename__ = "job_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    membership_id: Mapped[int] = mapped_column(
        ForeignKey("company_memberships.id", ondelete="CASCADE"), index=True
    )
    assigned_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("job_id", "membership_id", name="uq_job_assignment_membership"),
    )
