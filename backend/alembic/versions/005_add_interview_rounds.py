"""Add interview_rounds table for multi-stage recruitment pipeline.

Revision ID: 005
Revises: 004
Create Date: 2026-08-10

- Creates interview_rounds table with FK to applications
- Default status='pending', default round_type='custom'
- Supports 4.5.6 (interview scheduling) via scheduled_at, location columns
"""

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "interview_rounds",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "application_id",
            sa.Integer(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("round_type", sa.String(50), nullable=False, server_default="custom"),
        sa.Column("round_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("interview_rounds")
