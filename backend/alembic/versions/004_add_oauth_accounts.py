"""Add oauth_accounts table for OAuth (Google, etc.) linking.

Revision ID: 004
Revises: 003
Create Date: 2026-08-09

- Creates oauth_accounts table with FK to users
- Unique constraint on (provider, provider_user_id) to prevent duplicate links
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "oauth_accounts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("id_token", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),
    )


def downgrade() -> None:
    op.drop_table("oauth_accounts")
