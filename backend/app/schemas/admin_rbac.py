"""Admin RBAC Pydantic schemas — Roles, Permissions, and User Role Assignment."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminPermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    module: str
    name: str
    description: str | None = None


class AdminRoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None = None
    is_system: bool
    created_at: datetime
    permissions: list[AdminPermissionOut] = []
    user_count: int = 0


class AdminRoleCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    permission_ids: list[int] = []


class AdminRoleUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    permission_ids: list[int] | None = None


class AssignRoleRequest(BaseModel):
    admin_role_id: int | None = Field(
        None,
        description="ID of the AdminRole to assign, or null to remove specific admin role",
    )
