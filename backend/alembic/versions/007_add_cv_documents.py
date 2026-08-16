"""Add structured CV Builder documents.

Revision ID: 007
Revises: 006
"""

from alembic import op
import sqlalchemy as sa

revision: str = "007"
down_revision: str | None = "006"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "cv_documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(length=255), nullable=False, server_default="CV của tôi"),
        sa.Column("template_key", sa.String(length=64), nullable=False, server_default="ats-minimal"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("cv_documents")

