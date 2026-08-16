"""Link CV Builder documents to job applications.

Revision ID: 008
Revises: 007
"""

from alembic import op
import sqlalchemy as sa


revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("cv_document_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_applications_cv_document_id",
        "applications",
        "cv_documents",
        ["cv_document_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_applications_cv_document_id", "applications", type_="foreignkey")
    op.drop_column("applications", "cv_document_id")
