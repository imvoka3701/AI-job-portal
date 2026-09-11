"""Add UserFeedbacks table for multi-persona user feedback system.

Revision ID: 021
Revises: 020
"""

import sqlalchemy as sa
from alembic import op

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_feedbacks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "user_role", sa.String(50), nullable=False, server_default="candidate"
        ),
        sa.Column("sender_name", sa.String(255), nullable=False),
        sa.Column("sender_email", sa.String(255), nullable=False),
        sa.Column("sender_phone", sa.String(50), nullable=True),
        sa.Column(
            "feedback_type", sa.String(50), nullable=False, server_default="general"
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("target_id", sa.String(64), nullable=True),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="new"),
        sa.Column("priority", sa.String(50), nullable=False, server_default="medium"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("admin_response", sa.Text(), nullable=True),
        sa.Column(
            "resolved_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index("ix_user_feedbacks_id", "user_feedbacks", ["id"])
    op.create_index("ix_user_feedbacks_user_id", "user_feedbacks", ["user_id"])
    op.create_index("ix_user_feedbacks_sender_email", "user_feedbacks", ["sender_email"])
    op.create_index(
        "ix_user_feedbacks_role_status", "user_feedbacks", ["user_role", "status"]
    )
    op.create_index(
        "ix_user_feedbacks_type_priority",
        "user_feedbacks",
        ["feedback_type", "priority"],
    )
    op.create_index("ix_user_feedbacks_created_at", "user_feedbacks", ["created_at"])


def downgrade() -> None:
    op.drop_table("user_feedbacks")
