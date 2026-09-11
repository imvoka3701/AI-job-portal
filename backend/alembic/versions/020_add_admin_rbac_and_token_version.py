"""Add Admin RBAC tables, token versioning, and composite indexes.

Revision ID: 020
Revises: 019
"""

import sqlalchemy as sa
from alembic import op

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None

DEFAULT_PERMISSIONS = [
    # Module Company
    ("companies:read", "company", "Xem danh sách doanh nghiệp", "Xem thông tin các nhà tuyển dụng và công ty"),
    ("companies:verify", "company", "Xác thực doanh nghiệp", "Cấp hoặc thu hồi huy hiệu tick xanh xác thực"),
    ("companies:suspend", "company", "Khóa / Mở khóa doanh nghiệp", "Duyệt hồ sơ hoặc tạm dừng tài khoản doanh nghiệp"),
    # Module Job
    ("jobs:read", "job", "Xem danh sách tin tuyển dụng", "Xem danh sách tin tuyển dụng toàn sàn"),
    ("jobs:moderate", "job", "Kiểm duyệt tin tuyển dụng", "Đóng hoặc mở lại tin tuyển dụng"),
    ("jobs:delete", "job", "Xóa vĩnh viễn tin tuyển dụng", "Xóa vĩnh viễn tin tuyển dụng vi phạm nặng"),
    # Module Chat Trust & Safety
    ("chat:read", "chat", "Xem khiếu nại hội thoại", "Xem danh sách các cuộc trò chuyện bị báo cáo vi phạm"),
    ("chat:moderate", "chat", "Khóa / Mở khóa phòng chat", "Tạm khóa hội thoại hoặc gỡ cờ khiếu nại"),
    # Module Interviews
    ("interviews:read", "interview", "Xem tiến trình phỏng vấn", "Theo dõi các vòng phỏng vấn tuyển dụng đa vòng"),
    ("interviews:moderate", "interview", "Xử lý cờ phỏng vấn", "Đánh dấu đã xử lý các vòng phỏng vấn cần review"),
    # Module Users
    ("users:read", "user", "Xem danh sách người dùng", "Xem toàn bộ tài khoản ứng viên, NTD, admin"),
    ("users:suspend", "user", "Khóa / Mở khóa người dùng", "Khóa hoặc kích hoạt lại tài khoản người dùng"),
    ("users:assign_role", "user", "Phân quyền quản trị viên", "Gán vai trò Admin RBAC cho tài khoản quản trị"),
    # Module AI & Audit
    ("ai:prompts_read", "ai", "Xem cấu hình AI Prompts", "Xem các System Prompts của các tính năng AI"),
    ("ai:prompts_write", "ai", "Chỉnh sửa AI Prompts", "Cập nhật Prompt và thử nghiệm sandbox"),
    ("ai:logs_read", "ai", "Xem thống kê chi phí AI", "Theo dõi Token usage, độ trễ và chi phí USD"),
    ("audit:read", "audit", "Xem nhật ký kiểm toán", "Xem Zero-PII Audit Logs của toàn hệ thống"),
    # Module System
    ("system:manage", "system", "Quản trị hệ thống tối cao", "Toàn quyền cấu hình máy chủ và hạ tầng"),
]

DEFAULT_ROLES = [
    ("super_admin", "Quản trị viên Tối cao", "Toàn quyền quản trị toàn bộ hệ sinh thái", True),
    ("compliance_mod", "Kiểm duyệt viên Tuân thủ", "Chuyên trách thẩm định doanh nghiệp, tin tuyển dụng và xử lý vi phạm chat", False),
    ("recruitment_ops", "Chuyên viên Vận hành Tuyển dụng", "Giám sát tiến độ phỏng vấn đa vòng và xử lý khiếu nại tuyển dụng", False),
    ("ai_auditor", "Kiểm toán viên AI & Chi phí", "Giám sát chi phí DeepSeek LLM, nhật ký bảo mật và hiệu năng hệ thống", False),
]

ROLE_PERMISSIONS_MAP = {
    "compliance_mod": [
        "companies:read", "companies:verify", "companies:suspend",
        "jobs:read", "jobs:moderate",
        "chat:read", "chat:moderate",
        "users:read",
    ],
    "recruitment_ops": [
        "companies:read", "jobs:read",
        "interviews:read", "interviews:moderate",
        "users:read",
    ],
    "ai_auditor": [
        "ai:prompts_read", "ai:logs_read", "audit:read",
    ],
}


def upgrade() -> None:
    # 1. Create admin_roles table
    op.create_table(
        "admin_roles",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_system", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 2. Create admin_permissions table
    op.create_table(
        "admin_permissions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("code", sa.String(100), unique=True, nullable=False),
        sa.Column("module", sa.String(50), nullable=False, index=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
    )

    # 3. Create admin_role_permissions junction table
    op.create_table(
        "admin_role_permissions",
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("admin_roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer(), sa.ForeignKey("admin_permissions.id", ondelete="CASCADE"), primary_key=True),
    )

    # 4. Add admin_role_id and token_version to users
    op.add_column(
        "users",
        sa.Column("admin_role_id", sa.Integer(), sa.ForeignKey("admin_roles.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), server_default=sa.text("1"), nullable=False),
    )

    # 5. Composite & Partial Performance Indexes
    op.create_index(
        "idx_users_admin_filter",
        "users",
        ["role", "is_active", "created_at"],
    )
    op.create_index(
        "idx_jobs_admin_filter",
        "jobs",
        ["is_active", "created_at"],
    )
    op.create_index(
        "idx_chat_conv_governance",
        "conversations",
        ["is_reported", "is_locked", "updated_at"],
    )

    # 6. Seed initial Admin Roles & Permissions
    bind = op.get_bind()

    # Insert permissions
    perm_id_map = {}
    for code, module, name, desc in DEFAULT_PERMISSIONS:
        res = bind.execute(
            sa.text(
                "INSERT INTO admin_permissions (code, module, name, description) "
                "VALUES (:c, :m, :n, :d) RETURNING id"
            ),
            {"c": code, "m": module, "n": name, "d": desc},
        )
        perm_id_map[code] = res.scalar()

    # Insert roles
    role_id_map = {}
    for code, name, desc, is_sys in DEFAULT_ROLES:
        res = bind.execute(
            sa.text(
                "INSERT INTO admin_roles (code, name, description, is_system) "
                "VALUES (:c, :n, :d, :s) RETURNING id"
            ),
            {"c": code, "n": name, "d": desc, "s": is_sys},
        )
        role_id_map[code] = res.scalar()

    # Link Super Admin to all permissions
    super_admin_id = role_id_map.get("super_admin")
    if super_admin_id:
        for perm_id in perm_id_map.values():
            bind.execute(
                sa.text(
                    "INSERT INTO admin_role_permissions (role_id, permission_id) "
                    "VALUES (:r, :p) ON CONFLICT DO NOTHING"
                ),
                {"r": super_admin_id, "p": perm_id},
            )

    # Link specific roles
    for r_code, p_codes in ROLE_PERMISSIONS_MAP.items():
        r_id = role_id_map.get(r_code)
        if r_id:
            for p_code in p_codes:
                p_id = perm_id_map.get(p_code)
                if p_id:
                    bind.execute(
                        sa.text(
                            "INSERT INTO admin_role_permissions (role_id, permission_id) "
                            "VALUES (:r, :p) ON CONFLICT DO NOTHING"
                        ),
                        {"r": r_id, "p": p_id},
                    )

    # Automatically grant super_admin role to existing users with role = 'admin'
    if super_admin_id:
        bind.execute(
            sa.text("UPDATE users SET admin_role_id = :r WHERE role = 'admin'"),
            {"r": super_admin_id},
        )


def downgrade() -> None:
    op.drop_index("idx_chat_conv_governance", table_name="conversations")
    op.drop_index("idx_jobs_admin_filter", table_name="jobs")
    op.drop_index("idx_users_admin_filter", table_name="users")
    op.drop_column("users", "token_version")
    op.drop_column("users", "admin_role_id")
    op.drop_table("admin_role_permissions")
    op.drop_table("admin_permissions")
    op.drop_table("admin_roles")
