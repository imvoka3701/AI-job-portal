"""Add round_criteria_scores table for per-criteria scoring.

Revision ID: 006
Revises: 005
"""

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "round_criteria_scores",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("round_id", sa.Integer(), sa.ForeignKey("interview_rounds.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("criteria_name", sa.String(255), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.CheckConstraint("score >= 0 AND score <= 10", name="ck_criteria_score_range"),
    )


def downgrade() -> None:
    op.drop_table("round_criteria_scores")
