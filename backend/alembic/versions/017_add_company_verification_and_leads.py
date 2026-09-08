"""Add company verification, configs, and contact_leads table.

Revision ID: 017
Revises: bf10ee4875d2
"""

from alembic import op
import sqlalchemy as sa


revision = "017"
down_revision = "bf10ee4875d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Add missing columns to companies ──────────────────────────────────────
    op.add_column(
        "companies",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "companies",
        sa.Column("ai_matching_weights", sa.JSON(), nullable=True),
    )
    op.add_column(
        "companies",
        sa.Column("webhook_config", sa.JSON(), nullable=True),
    )

    # ── Create contact_leads table ────────────────────────────────────────────
    op.create_table(
        "contact_leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("location", sa.String(100), nullable=False),
        sa.Column("service_package", sa.String(50), nullable=False, server_default="pro"),
        sa.Column("status", sa.String(50), nullable=False, server_default="new"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_contact_leads_id", "contact_leads", ["id"])
    op.create_index("ix_contact_leads_email", "contact_leads", ["email"])


def downgrade() -> None:
    op.drop_index("ix_contact_leads_email", table_name="contact_leads")
    op.drop_index("ix_contact_leads_id", table_name="contact_leads")
    op.drop_table("contact_leads")
    op.drop_column("companies", "webhook_config")
    op.drop_column("companies", "ai_matching_weights")
    op.drop_column("companies", "is_verified")
