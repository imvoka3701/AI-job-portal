"""Alembic migration environment configuration."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import settings
from app.database import Base

# Import all models explicitly so Alembic can detect schema changes
from app.models.user import User  # noqa: F401
from app.models.job import Job, JobCategory  # noqa: F401
from app.models.application import Application  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.cv_document import CvDocument  # noqa: F401
from app.models.admin_audit_log import AdminAuditLog  # noqa: F401
from app.models.company import Company, CompanyInvitation, CompanyMembership, Department, JobAssignment  # noqa: F401
from app.models.assessment import AssessmentAttempt  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
