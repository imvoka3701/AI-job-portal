"""Admin RBAC router — Dynamic Role & Granular Permission Management.

Features:
1. List, create, update, and delete administrative roles.
2. View full granular permission catalogue.
3. Assign administrative roles to users with instant session invalidation (token_version increment).
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.crud.admin_audit_log import crud_admin_audit_log
from app.database import get_db
from app.models.admin_rbac import AdminPermission, AdminRole
from app.models.user import User, UserRole
from app.schemas.admin_rbac import (
    AdminPermissionOut,
    AdminRoleCreate,
    AdminRoleOut,
    AdminRoleUpdate,
    AssignRoleRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/rbac", tags=["Admin RBAC & Security"])


@router.get(
    "/permissions",
    response_model=list[AdminPermissionOut],
    summary="Danh sách quyền hạn chi tiết (Granular Permissions)",
    description="Truy xuất toàn bộ danh mục quyền hệ thống nhóm theo module.",
)
def list_permissions(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.view")),
) -> Any:
    perms = db.query(AdminPermission).order_by(AdminPermission.module, AdminPermission.code).all()
    return perms


@router.get(
    "/roles",
    response_model=list[AdminRoleOut],
    summary="Danh sách vai trò quản trị (Admin Roles)",
    description="Liệt kê toàn bộ vai trò quản trị viên kèm quyền hạn và số lượng người dùng được gán.",
)
def list_roles(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.view")),
) -> Any:
    roles = db.query(AdminRole).order_by(AdminRole.is_system.desc(), AdminRole.id.asc()).all()

    # Calculate user count per role
    user_counts = dict(
        db.query(User.admin_role_id, func.count(User.id))
        .filter(User.admin_role_id.isnot(None))
        .group_by(User.admin_role_id)
        .all()
    )

    result = []
    for r in roles:
        r_out = AdminRoleOut(
            id=r.id,
            code=r.code,
            name=r.name,
            description=r.description,
            is_system=r.is_system,
            created_at=r.created_at,
            permissions=[AdminPermissionOut.model_validate(p) for p in r.permissions],
            user_count=user_counts.get(r.id, 0),
        )
        result.append(r_out)
    return result


@router.post(
    "/roles",
    response_model=AdminRoleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo vai trò quản trị mới",
)
def create_role(
    payload: AdminRoleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.manage")),
) -> Any:
    existing = db.query(AdminRole).filter(AdminRole.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã vai trò '{payload.code}' đã tồn tại trong hệ thống.",
        )

    new_role = AdminRole(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        is_system=False,
    )

    if payload.permission_ids:
        perms = (
            db.query(AdminPermission)
            .filter(AdminPermission.id.in_(payload.permission_ids))
            .all()
        )
        new_role.permissions = perms

    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    # Audit log
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="admin.rbac.role_create",
        target_type="admin_role",
        target_id=str(new_role.id),
        target_label=new_role.name,
        details={"code": new_role.code, "permissions_count": len(new_role.permissions)},
    )

    return AdminRoleOut(
        id=new_role.id,
        code=new_role.code,
        name=new_role.name,
        description=new_role.description,
        is_system=new_role.is_system,
        created_at=new_role.created_at,
        permissions=[AdminPermissionOut.model_validate(p) for p in new_role.permissions],
        user_count=0,
    )


@router.put(
    "/roles/{role_id}",
    response_model=AdminRoleOut,
    summary="Cập nhật vai trò quản trị",
)
def update_role(
    role_id: int,
    payload: AdminRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.manage")),
) -> Any:
    role = db.query(AdminRole).filter(AdminRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vai trò.")

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description

    if payload.permission_ids is not None:
        # System super_admin cannot have permissions stripped
        if role.is_system and role.code == "super_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể thay đổi quyền hạn của vai trò Quản trị viên Tối cao (super_admin).",
            )
        perms = (
            db.query(AdminPermission)
            .filter(AdminPermission.id.in_(payload.permission_ids))
            .all()
        )
        role.permissions = perms

        # Invalidate active JWT tokens of all users having this role
        db.query(User).filter(User.admin_role_id == role.id).update(
            {User.token_version: User.token_version + 1}, synchronize_session=False
        )

    db.commit()
    db.refresh(role)

    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="admin.rbac.role_update",
        target_type="admin_role",
        target_id=str(role.id),
        target_label=role.name,
        details={"permissions_count": len(role.permissions)},
    )

    user_count = db.query(func.count(User.id)).filter(User.admin_role_id == role.id).scalar() or 0

    return AdminRoleOut(
        id=role.id,
        code=role.code,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        created_at=role.created_at,
        permissions=[AdminPermissionOut.model_validate(p) for p in role.permissions],
        user_count=user_count,
    )


@router.delete(
    "/roles/{role_id}",
    status_code=status.HTTP_200_OK,
    summary="Xóa vai trò tùy chỉnh",
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.manage")),
) -> Any:
    role = db.query(AdminRole).filter(AdminRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vai trò.")

    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa vai trò mặc định của hệ thống (System Role).",
        )

    assigned_count = db.query(func.count(User.id)).filter(User.admin_role_id == role.id).scalar() or 0
    if assigned_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vai trò đang được gán cho {assigned_count} người dùng. Hãy chuyển vai trò cho người dùng trước khi xóa.",
        )

    role_name = role.name
    db.delete(role)
    db.commit()

    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="admin.rbac.role_delete",
        target_type="admin_role",
        target_id=str(role_id),
        target_label=role_name,
        details={},
    )

    return {"message": f"Đã xóa thành công vai trò '{role_name}'."}


@router.post(
    "/users/{user_id}/assign-role",
    summary="Gán vai trò quản trị cho người dùng & Thu hồi phiên JWT tức thì",
    description="Thay đổi admin_role_id và tự động tăng token_version để buộc người dùng đăng nhập lại với quyền hạn mới.",
)
def assign_admin_role(
    user_id: int,
    payload: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("admin.roles.manage")),
) -> Any:
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng.")

    if payload.admin_role_id is not None:
        role = db.query(AdminRole).filter(AdminRole.id == payload.admin_role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vai trò quản trị được chỉ định không tồn tại.",
            )
        # If user is not yet an admin, upgrade them to ADMIN
        if target_user.role != UserRole.ADMIN:
            target_user.role = UserRole.ADMIN
        target_user.admin_role_id = role.id
        role_name = role.name
        role_code = role.code
    else:
        # Unassign admin role
        target_user.admin_role_id = None
        role_name = None
        role_code = None

    # Force instant session invalidation for this user by bumping token_version
    target_user.token_version = (target_user.token_version or 1) + 1

    db.commit()
    db.refresh(target_user)

    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="admin.rbac.user_assign_role",
        target_type="user",
        target_id=str(target_user.id),
        target_label=target_user.email,
        details={
            "new_admin_role_id": target_user.admin_role_id,
            "new_admin_role_code": role_code,
            "bumped_token_version": target_user.token_version,
        },
    )

    return {
        "message": "Đã cập nhật vai trò quản trị thành công. Phiên đăng nhập cũ đã được vô hiệu hóa tức thì.",
        "user_id": target_user.id,
        "email": target_user.email,
        "admin_role_id": target_user.admin_role_id,
        "admin_role_code": role_code,
        "admin_role_name": role_name,
        "token_version": target_user.token_version,
    }
