"""Add ai_evaluation_json to resumes table.

Revision ID: 023
Revises: 022
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa

revision: str = "023"
down_revision: str | None = "022"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("ai_evaluation_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("resumes", "ai_evaluation_json")
