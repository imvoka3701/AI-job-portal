"""Add review fields and operational compound indexes to interview_rounds.

Revision ID: 014
Revises: 013
"""

from alembic import op
import sqlalchemy as sa


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "interview_rounds",
        sa.Column(
            "needs_review",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "interview_rounds",
        sa.Column("review_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "interview_rounds",
        sa.Column(
            "marked_by_admin_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_interview_rounds_needs_review", "interview_rounds", ["needs_review"])
    op.create_index(
        "ix_interview_rounds_review_status",
        "interview_rounds",
        ["needs_review", "round_type", "status"],
    )
    op.create_index(
        "ix_interview_rounds_overdue",
        "interview_rounds",
        ["status", "scheduled_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_interview_rounds_overdue", table_name="interview_rounds")
    op.drop_index("ix_interview_rounds_review_status", table_name="interview_rounds")
    op.drop_index("ix_interview_rounds_needs_review", table_name="interview_rounds")
    op.drop_column("interview_rounds", "marked_by_admin_id")
    op.drop_column("interview_rounds", "review_reason")
    op.drop_column("interview_rounds", "needs_review")
