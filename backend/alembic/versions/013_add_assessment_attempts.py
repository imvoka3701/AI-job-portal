"""Add candidate-owned MBTI/MI assessment attempts.

Revision ID: 013
Revises: 012
"""

from alembic import op
import sqlalchemy as sa


revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "assessment_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_type", sa.String(length=20), nullable=False),
        sa.Column("questionnaire_version", sa.String(length=30), nullable=False),
        sa.Column("answers_json", sa.JSON(), nullable=False),
        sa.Column("result_code", sa.String(length=30), nullable=False),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_assessment_attempts_id", "assessment_attempts", ["id"])
    op.create_index("ix_assessment_attempts_user_id", "assessment_attempts", ["user_id"])
    op.create_index("ix_assessment_attempts_assessment_type", "assessment_attempts", ["assessment_type"])
    op.create_index("ix_assessment_attempt_user_type", "assessment_attempts", ["user_id", "assessment_type"])


def downgrade() -> None:
    op.drop_index("ix_assessment_attempt_user_type", table_name="assessment_attempts")
    op.drop_index("ix_assessment_attempts_assessment_type", table_name="assessment_attempts")
    op.drop_index("ix_assessment_attempts_user_id", table_name="assessment_attempts")
    op.drop_index("ix_assessment_attempts_id", table_name="assessment_attempts")
    op.drop_table("assessment_attempts")
