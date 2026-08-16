"""Initial schema — create all tables.

Revision ID: 001
Revises: 
Create Date: 2026-08-07

Tables created:
  - users
  - job_categories
  - jobs
  - resumes  (with pgvector embedding + HNSW index)
  - applications
  - notifications
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic
revision: str = "001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None

# Embedding dimension — must match app/models/resume.py
EMBEDDING_DIM = 1536


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Enable pgvector extension (requires superuser or rds_superuser)
    # ------------------------------------------------------------------
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ------------------------------------------------------------------
    # ENUM types
    # ------------------------------------------------------------------
    userrole = postgresql.ENUM("candidate", "employer", "admin", name="userrole", create_type=False)
    jobtype = postgresql.ENUM(
        "full_time", "part_time", "internship", "freelance", "remote", name="jobtype", create_type=False
    )
    experiencelevel = postgresql.ENUM(
        "fresher", "junior", "middle", "senior", "lead", name="experiencelevel", create_type=False
    )
    applicationstatus = postgresql.ENUM(
        "pending", "reviewed", "shortlisted", "interview", "accepted", "rejected",
        name="applicationstatus",
        create_type=False,
    )
    notificationtype = postgresql.ENUM(
        "application_update", "new_job_match", "system", name="notificationtype", create_type=False
    )

    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('candidate', 'employer', 'admin');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE TYPE jobtype AS ENUM ('full_time', 'part_time', 'internship', 'freelance', 'remote');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE TYPE experiencelevel AS ENUM ('fresher', 'junior', 'middle', 'senior', 'lead');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE TYPE applicationstatus AS ENUM ('pending', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE TYPE notificationtype AS ENUM ('application_update', 'new_job_match', 'system');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """
    )

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", userrole, nullable=False, server_default="candidate"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        # Employer-specific
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("company_logo_url", sa.String(500), nullable=True),
        sa.Column("company_description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # job_categories
    # ------------------------------------------------------------------
    op.create_table(
        "job_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
    )
    op.create_unique_constraint("uq_job_categories_name", "job_categories", ["name"])
    op.create_unique_constraint("uq_job_categories_slug", "job_categories", ["slug"])

    # ------------------------------------------------------------------
    # jobs
    # ------------------------------------------------------------------
    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=True),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column(
            "job_type",
            jobtype,
            nullable=False,
            server_default="full_time",
        ),
        sa.Column(
            "experience_level",
            experiencelevel,
            nullable=False,
            server_default="fresher",
        ),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("employer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("job_categories.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_jobs_title", "jobs", ["title"])

    # ------------------------------------------------------------------
    # resumes  (with pgvector column)
    # ------------------------------------------------------------------
    op.create_table(
        "resumes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("parsed_skills", sa.Text(), nullable=True),
        sa.Column("parsed_experience", sa.Text(), nullable=True),
        sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # HNSW index for cosine similarity search (requires pgvector >= 0.5)
    op.execute(
        """
        CREATE INDEX ix_resumes_embedding_hnsw
        ON resumes
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )

    # ------------------------------------------------------------------
    # applications
    # ------------------------------------------------------------------
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column(
            "status",
            applicationstatus,
            nullable=False,
            server_default="pending",
        ),
        sa.Column("ai_matching_score", sa.Float(), nullable=True),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id"), nullable=True),
        sa.Column(
            "applied_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ------------------------------------------------------------------
    # notifications
    # ------------------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "type",
            notificationtype,
            nullable=False,
            server_default="system",
        ),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("notifications")
    op.drop_index("ix_resumes_embedding_hnsw", table_name="resumes")
    op.drop_table("applications")
    op.drop_table("resumes")
    op.drop_table("jobs")
    op.drop_table("job_categories")
    op.drop_table("users")

    # Drop ENUM types
    postgresql.ENUM(name="notificationtype").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="applicationstatus").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="experiencelevel").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="jobtype").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="userrole").drop(op.get_bind(), checkfirst=True)

    op.execute("DROP EXTENSION IF EXISTS vector")
