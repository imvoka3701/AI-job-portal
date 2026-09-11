"""Admin RBAC models — Dynamic Roles and Granular Permissions."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AdminRolePermission(Base):
    """Many-to-many junction table between AdminRole and AdminPermission."""

    __tablename__ = "admin_role_permissions"

    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("admin_roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("admin_permissions.id", ondelete="CASCADE"), primary_key=True
    )


class AdminRole(Base):
    """Admin Role entity defining administrative roles with assigned permissions."""

    __tablename__ = "admin_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    permissions: Mapped[list["AdminPermission"]] = relationship(
        "AdminPermission",
        secondary="admin_role_permissions",
        back_populates="roles",
        lazy="selectin",
    )
    users: Mapped[list["User"]] = relationship("User", back_populates="admin_role")  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<AdminRole {self.code} ({self.name})>"


class AdminPermission(Base):
    """Granular permission representing an administrative action or resource access."""

    __tablename__ = "admin_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    module: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    roles: Mapped[list[AdminRole]] = relationship(
        AdminRole,
        secondary="admin_role_permissions",
        back_populates="permissions",
    )

    def __repr__(self) -> str:
        return f"<AdminPermission {self.code}>"
