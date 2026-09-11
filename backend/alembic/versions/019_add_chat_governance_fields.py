"""Add governance and moderation fields to conversations table.

Revision ID: 019
Revises: 018
"""

import sqlalchemy as sa
from alembic import op

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("is_locked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "conversations",
        sa.Column("is_reported", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "conversations",
        sa.Column("report_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "conversations",
        sa.Column(
            "reported_by_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "conversations",
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_constraint("conversations_reported_by_id_fkey", "conversations", type_="foreignkey")
    op.drop_column("conversations", "reported_at")
    op.drop_column("conversations", "reported_by_id")
    op.drop_column("conversations", "report_reason")
    op.drop_column("conversations", "is_reported")
    op.drop_column("conversations", "is_locked")
