"""
AI Job Portal — Database Configuration.

Sets up SQLAlchemy engine, session factory, and declarative Base.
"""

from collections.abc import Generator
import enum

from sqlalchemy import create_engine, Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


def pg_enum(enum_cls: type[enum.Enum], name: str) -> SAEnum:
    """Map Python enums to existing PostgreSQL ENUM types using member values."""
    return SAEnum(
        enum_cls,
        name=name,
        values_callable=lambda members: [member.value for member in members],
        create_type=False,
    )


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
