"""Tests for Admin RBAC system — Dynamic Roles, Permissions, and Token Invalidation."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin_rbac import AdminPermission, AdminRole
from app.models.user import User, UserRole


def _seed_rbac(db: Session) -> AdminRole:
    """Helper to seed initial permissions and super_admin role for tests."""
    perms_data = [
        ("admin.users.view", "users", "Xem người dùng"),
        ("admin.users.manage", "users", "Quản lý người dùng"),
        ("admin.roles.view", "rbac", "Xem vai trò"),
        ("admin.roles.manage", "rbac", "Quản trị vai trò"),
        ("admin.jobs.moderate", "jobs", "Kiểm duyệt tin"),
    ]
    perms = []
    for code, mod, name in perms_data:
        p = db.query(AdminPermission).filter(AdminPermission.code == code).first()
        if not p:
            p = AdminPermission(code=code, module=mod, name=name)
            db.add(p)
            db.flush()
        perms.append(p)

    super_role = db.query(AdminRole).filter(AdminRole.code == "super_admin").first()
    if not super_role:
        super_role = AdminRole(
            code="super_admin",
            name="Quản trị viên Tối cao",
            is_system=True,
        )
        super_role.permissions = perms
        db.add(super_role)
        db.flush()

    comp_role = db.query(AdminRole).filter(AdminRole.code == "compliance_mod").first()
    if not comp_role:
        comp_role = AdminRole(
            code="compliance_mod",
            name="Kiểm duyệt viên Tuân thủ",
            is_system=False,
        )
        comp_role.permissions = [p for p in perms if "moderate" in p.code or "view" in p.code]
        db.add(comp_role)
        db.flush()

    db.commit()
    return super_role


def _create_admin(client: TestClient, db: Session) -> tuple[User, dict[str, str]]:
    super_role = _seed_rbac(db)
    user = User(
        email="superadmin@jobportal.vn",
        hashed_password=hash_password("admin_pass"),
        full_name="Super Admin",
        role=UserRole.ADMIN,
        admin_role_id=super_role.id,
        is_active=True,
        token_version=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    res = client.post("/auth/login", json={"email": user.email, "password": "admin_pass"})
    assert res.status_code == 200, res.text
    return user, {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_admin_rbac_permissions_and_roles(client: TestClient, db_session: Session):
    """Admin can fetch permissions and default roles."""
    _, headers = _create_admin(client, db_session)

    # 1. Fetch permissions
    res_perm = client.get("/admin/rbac/permissions", headers=headers)
    assert res_perm.status_code == 200, res_perm.text
    perms = res_perm.json()
    assert len(perms) >= 5
    codes = [p["code"] for p in perms]
    assert "admin.users.view" in codes
    assert "admin.roles.manage" in codes

    # 2. Fetch roles
    res_roles = client.get("/admin/rbac/roles", headers=headers)
    assert res_roles.status_code == 200, res_roles.text
    roles = res_roles.json()
    role_codes = [r["code"] for r in roles]
    assert "super_admin" in role_codes
    assert "compliance_mod" in role_codes


def test_admin_rbac_create_and_delete_custom_role(client: TestClient, db_session: Session):
    """Admin can create a custom role and then delete it."""
    _, headers = _create_admin(client, db_session)

    # 1. Get a permission id
    res_perm = client.get("/admin/rbac/permissions", headers=headers)
    perm_id = res_perm.json()[0]["id"]

    # 2. Create custom role
    create_payload = {
        "code": "test_security_officer",
        "name": "Security Officer",
        "description": "Handles security events",
        "permission_ids": [perm_id],
    }
    res_create = client.post("/admin/rbac/roles", headers=headers, json=create_payload)
    assert res_create.status_code == 201, res_create.text
    created_role = res_create.json()
    assert created_role["code"] == "test_security_officer"
    assert created_role["is_system"] is False
    assert len(created_role["permissions"]) == 1
    role_id = created_role["id"]

    # 3. Delete custom role
    res_del = client.delete(f"/admin/rbac/roles/{role_id}", headers=headers)
    assert res_del.status_code == 200, res_del.text


def test_admin_rbac_token_version_invalidation(client: TestClient, db_session: Session):
    """When a user's role is reassigned, token_version is incremented and old JWT is immediately rejected."""
    _, admin_headers = _create_admin(client, db_session)

    # 1. Create a test user
    email = "mod@jobportal.vn"
    pwd = "Password@123"
    test_user = User(
        email=email,
        hashed_password=hash_password(pwd),
        full_name="Test Moderator",
        role=UserRole.ADMIN,
        is_active=True,
        token_version=1,
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    # 2. Login as test user to get a token with token_version = 1
    login_res = client.post("/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200, login_res.text
    old_token = login_res.json()["access_token"]

    # 3. Verify old token works
    test_headers = {"Authorization": f"Bearer {old_token}"}
    res_check = client.get("/users/me", headers=test_headers)
    assert res_check.status_code == 200, res_check.text

    # 4. Super Admin assigns a specific role (compliance_mod) to test user
    comp_role = db_session.query(AdminRole).filter(AdminRole.code == "compliance_mod").first()
    assert comp_role is not None

    assign_res = client.post(
        f"/admin/rbac/users/{test_user.id}/assign-role",
        headers=admin_headers,
        json={"admin_role_id": comp_role.id},
    )
    assert assign_res.status_code == 200, assign_res.text
    assign_data = assign_res.json()
    assert assign_data["token_version"] == 2

    # 5. IMMEDIATELY test that the OLD token is now REJECTED (401 Unauthorized)
    res_rejected = client.get("/users/me", headers=test_headers)
    assert res_rejected.status_code == 401
    assert "Phiên đăng nhập đã hết hiệu lực" in res_rejected.text

    # 6. Test user logs in again to get NEW token with token_version = 2
    login_res2 = client.post("/auth/login", json={"email": email, "password": pwd})
    assert login_res2.status_code == 200
    new_token = login_res2.json()["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}

    res_success = client.get("/users/me", headers=new_headers)
    assert res_success.status_code == 200
    assert res_success.json()["email"] == email
