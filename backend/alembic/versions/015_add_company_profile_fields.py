"""Add profile, legal, and contact columns to companies table.

Revision ID: 015
Revises: 014
"""

from alembic import op
import sqlalchemy as sa


revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("website", sa.String(500), nullable=True))
    op.add_column("companies", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("tax_code", sa.String(50), nullable=True))
    op.add_column("companies", sa.Column("industry", sa.String(200), nullable=True))
    op.add_column("companies", sa.Column("company_size", sa.String(100), nullable=True))
    op.add_column("companies", sa.Column("social_links", sa.JSON(), nullable=True))
    op.add_column("companies", sa.Column("contact_person_name", sa.String(255), nullable=True))
    op.add_column("companies", sa.Column("contact_person_email", sa.String(255), nullable=True))
    op.add_column("companies", sa.Column("contact_person_phone", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("companies", "contact_person_phone")
    op.drop_column("companies", "contact_person_email")
    op.drop_column("companies", "contact_person_name")
    op.drop_column("companies", "social_links")
    op.drop_column("companies", "company_size")
    op.drop_column("companies", "industry")
    op.drop_column("companies", "tax_code")
    op.drop_column("companies", "address")
    op.drop_column("companies", "website")
