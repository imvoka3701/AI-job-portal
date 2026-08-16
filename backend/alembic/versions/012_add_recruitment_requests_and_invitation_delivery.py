"""Add recruitment request workflow and invitation delivery tracking.

Revision ID: 012
Revises: 011
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


invitation_delivery_status = postgresql.ENUM(
    "not_configured", "pending", "sent", "failed", "bounced",
    name="invitationdeliverystatus",
    create_type=False,
)
recruitment_request_status = postgresql.ENUM(
    "draft", "submitted", "approved", "rejected", "cancelled",
    name="recruitmentrequeststatus",
    create_type=False,
)
recruitment_priority = postgresql.ENUM(
    "low", "normal", "high", "urgent",
    name="recruitmentpriority",
    create_type=False,
)
job_type = postgresql.ENUM(
    "full_time", "part_time", "internship", "freelance", "remote",
    name="jobtype",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM(
        "not_configured", "pending", "sent", "failed", "bounced",
        name="invitationdeliverystatus",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "draft", "submitted", "approved", "rejected", "cancelled",
        name="recruitmentrequeststatus",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "low", "normal", "high", "urgent",
        name="recruitmentpriority",
    ).create(bind, checkfirst=True)

    op.add_column(
        "company_invitations",
        sa.Column(
            "delivery_status",
            invitation_delivery_status,
            nullable=False,
            server_default="not_configured",
        ),
    )
    op.add_column(
        "company_invitations",
        sa.Column("delivery_attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("company_invitations", sa.Column("message_id", sa.String(255), nullable=True))
    op.add_column("company_invitations", sa.Column("delivery_error", sa.Text(), nullable=True))
    op.add_column("company_invitations", sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("company_invitations", sa.Column("bounced_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint(
        "uq_company_invitations_message_id",
        "company_invitations",
        ["message_id"],
    )

    op.create_table(
        "recruitment_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("requested_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("headcount", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("job_type", job_type, nullable=False, server_default="full_time"),
        sa.Column("priority", recruitment_priority, nullable=False, server_default="normal"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("responsibilities", sa.Text(), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=False),
        sa.Column("target_start_date", sa.Date(), nullable=True),
        sa.Column("status", recruitment_request_status, nullable=False, server_default="draft"),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("converted_job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("converted_job_id", name="uq_recruitment_requests_converted_job_id"),
    )
    op.create_index("ix_recruitment_requests_company_id", "recruitment_requests", ["company_id"])
    op.create_index("ix_recruitment_requests_department_id", "recruitment_requests", ["department_id"])
    op.create_index("ix_recruitment_requests_requested_by_id", "recruitment_requests", ["requested_by_id"])
    op.create_index(
        "ix_recruitment_request_company_status",
        "recruitment_requests",
        ["company_id", "status", "created_at"],
    )
    op.create_index(
        "ix_recruitment_request_department_status",
        "recruitment_requests",
        ["department_id", "status", "created_at"],
    )


def downgrade() -> None:
    op.drop_table("recruitment_requests")
    op.drop_constraint(
        "uq_company_invitations_message_id",
        "company_invitations",
        type_="unique",
    )
    for column in [
        "bounced_at",
        "sent_at",
        "delivery_error",
        "message_id",
        "delivery_attempts",
        "delivery_status",
    ]:
        op.drop_column("company_invitations", column)
    bind = op.get_bind()
    for enum_type in [
        recruitment_priority,
        recruitment_request_status,
        invitation_delivery_status,
    ]:
        enum_type.drop(bind, checkfirst=True)
