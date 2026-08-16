"""Scope audit activity by company.

Revision ID: 011
Revises: 010
"""

from alembic import op
import sqlalchemy as sa


revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_audit_logs",
        sa.Column("company_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_admin_audit_logs_company_id",
        "admin_audit_logs",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_admin_audit_logs_company_id",
        "admin_audit_logs",
        ["company_id"],
    )
    op.create_index(
        "ix_admin_audit_company_activity",
        "admin_audit_logs",
        ["company_id", "created_at"],
    )

    op.execute(
        "UPDATE admin_audit_logs "
        "SET company_id = NULLIF(details_json->>'company_id', '')::integer "
        "WHERE NULLIF(details_json->>'company_id', '') IS NOT NULL"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = d.company_id "
        "FROM departments d WHERE a.company_id IS NULL "
        "AND a.target_type = 'department' AND a.target_id = d.id::text"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = i.company_id "
        "FROM company_invitations i WHERE a.company_id IS NULL "
        "AND a.target_type = 'invitation' AND a.target_id = i.id::text"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = m.company_id "
        "FROM company_memberships m WHERE a.company_id IS NULL "
        "AND a.target_type = 'membership' AND a.target_id = m.id::text"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = j.company_id "
        "FROM jobs j WHERE a.company_id IS NULL "
        "AND a.target_type = 'job' AND a.target_id = j.id::text"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = j.company_id "
        "FROM applications ap JOIN jobs j ON j.id = ap.job_id "
        "WHERE a.company_id IS NULL AND a.target_type = 'application' "
        "AND a.target_id = ap.id::text"
    )
    op.execute(
        "UPDATE admin_audit_logs a SET company_id = c.id "
        "FROM companies c WHERE a.company_id IS NULL "
        "AND a.target_type = 'company' "
        "AND a.target_id = c.created_by_user_id::text"
    )


def downgrade() -> None:
    op.drop_index("ix_admin_audit_company_activity", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_company_id", table_name="admin_audit_logs")
    op.drop_constraint(
        "fk_admin_audit_logs_company_id",
        "admin_audit_logs",
        type_="foreignkey",
    )
    op.drop_column("admin_audit_logs", "company_id")
