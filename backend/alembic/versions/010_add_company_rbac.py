"""Add company tenancy and internal employer RBAC.

Revision ID: 010
Revises: 009
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


membership_role = postgresql.ENUM("hr", "department_head", name="membershiprole", create_type=False)
membership_status = postgresql.ENUM("active", "suspended", "revoked", name="membershipstatus", create_type=False)
invitation_status = postgresql.ENUM("pending", "accepted", "declined", "revoked", "expired", name="invitationstatus", create_type=False)
hiring_recommendation = postgresql.ENUM("recommended", "not_recommended", "needs_more_review", name="hiringrecommendation", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("hr", "department_head", name="membershiprole").create(bind, checkfirst=True)
    postgresql.ENUM("active", "suspended", "revoked", name="membershipstatus").create(bind, checkfirst=True)
    postgresql.ENUM("pending", "accepted", "declined", "revoked", "expired", name="invitationstatus").create(bind, checkfirst=True)
    postgresql.ENUM("recommended", "not_recommended", "needs_more_review", name="hiringrecommendation").create(bind, checkfirst=True)

    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_companies_name", "companies", ["name"])
    op.create_index("ix_companies_created_by_user_id", "companies", ["created_by_user_id"])

    op.create_table(
        "departments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("company_id", "name", name="uq_department_company_name"),
    )
    op.create_index("ix_departments_company_id", "departments", ["company_id"])

    op.create_table(
        "company_memberships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_role", membership_role, nullable=False),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", membership_status, nullable=False, server_default="active"),
        sa.Column("is_owner", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("invited_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("membership_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("company_id", "user_id", name="uq_company_membership_user"),
    )
    op.create_index("ix_company_memberships_company_id", "company_memberships", ["company_id"])
    op.create_index("ix_company_memberships_user_id", "company_memberships", ["user_id"])
    op.create_index("ix_company_memberships_department_id", "company_memberships", ["department_id"])
    op.create_index("ix_company_membership_scope", "company_memberships", ["company_id", "department_id", "member_role", "status"])

    op.create_table(
        "company_invitations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("member_role", membership_role, nullable=False),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", invitation_status, nullable=False, server_default="pending"),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("invited_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_company_invitations_company_id", "company_invitations", ["company_id"])
    op.create_index("ix_company_invitations_email", "company_invitations", ["email"])
    op.create_index("ix_company_invitation_lookup", "company_invitations", ["company_id", "email", "status"])

    op.add_column("jobs", sa.Column("company_id", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("department_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_jobs_company_id", "jobs", "companies", ["company_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_jobs_department_id", "jobs", "departments", ["department_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])
    op.create_index("ix_jobs_department_id", "jobs", ["department_id"])

    op.create_table(
        "job_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("membership_id", sa.Integer(), sa.ForeignKey("company_memberships.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("job_id", "membership_id", name="uq_job_assignment_membership"),
    )
    op.create_index("ix_job_assignments_job_id", "job_assignments", ["job_id"])
    op.create_index("ix_job_assignments_membership_id", "job_assignments", ["membership_id"])

    op.add_column("applications", sa.Column("hiring_recommendation", hiring_recommendation, nullable=True))
    op.add_column("applications", sa.Column("recommendation_note", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("recommendation_by_id", sa.Integer(), nullable=True))
    op.add_column("applications", sa.Column("recommended_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("applications", sa.Column("decision_by_id", sa.Integer(), nullable=True))
    op.add_column("applications", sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("applications", sa.Column("decision_reason", sa.Text(), nullable=True))
    op.create_foreign_key("fk_applications_recommendation_by", "applications", "users", ["recommendation_by_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_applications_decision_by", "applications", "users", ["decision_by_id"], ["id"], ondelete="SET NULL")

    op.execute(
        "INSERT INTO companies (name, description, logo_url, is_active, created_by_user_id) "
        "SELECT COALESCE(company_name, full_name), company_description, company_logo_url, is_active, id "
        "FROM users WHERE role = 'employer'"
    )
    op.execute(
        "INSERT INTO company_memberships (company_id, user_id, member_role, status, is_owner, invited_by) "
        "SELECT c.id, c.created_by_user_id, 'hr', 'active', true, c.created_by_user_id FROM companies c"
    )
    op.execute(
        "UPDATE jobs j SET company_id = c.id FROM companies c "
        "WHERE c.created_by_user_id = j.employer_id AND j.company_id IS NULL"
    )


def downgrade() -> None:
    op.drop_constraint("fk_applications_decision_by", "applications", type_="foreignkey")
    op.drop_constraint("fk_applications_recommendation_by", "applications", type_="foreignkey")
    for column in ["decision_reason", "decided_at", "decision_by_id", "recommended_at", "recommendation_by_id", "recommendation_note", "hiring_recommendation"]:
        op.drop_column("applications", column)
    op.drop_table("job_assignments")
    op.drop_index("ix_jobs_department_id", table_name="jobs")
    op.drop_index("ix_jobs_company_id", table_name="jobs")
    op.drop_constraint("fk_jobs_department_id", "jobs", type_="foreignkey")
    op.drop_constraint("fk_jobs_company_id", "jobs", type_="foreignkey")
    op.drop_column("jobs", "department_id")
    op.drop_column("jobs", "company_id")
    op.drop_table("company_invitations")
    op.drop_table("company_memberships")
    op.drop_table("departments")
    op.drop_table("companies")
    bind = op.get_bind()
    for enum_type in [hiring_recommendation, invitation_status, membership_status, membership_role]:
        enum_type.drop(bind, checkfirst=True)
