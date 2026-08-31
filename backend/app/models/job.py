"""Job & JobCategory ORM models."""

import enum
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, pg_enum
from app.models.resume import EMBEDDING_DIM


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"
    REMOTE = "remote"


class ExperienceLevel(str, enum.Enum):
    FRESHER = "fresher"
    JUNIOR = "junior"
    MIDDLE = "middle"
    SENIOR = "senior"
    LEAD = "lead"


class JobCategory(Base):
    __tablename__ = "job_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    jobs: Mapped[list["Job"]] = relationship(back_populates="category")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefits: Mapped[str | None] = mapped_column(Text, nullable=True)

    job_type: Mapped[JobType] = mapped_column(
        pg_enum(JobType, "jobtype"), default=JobType.FULL_TIME
    )
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        pg_enum(ExperienceLevel, "experiencelevel"), default=ExperienceLevel.FRESHER
    )

    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # pgvector embedding for AI matching (cosine similarity with resume embeddings)
    embedding = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

    # Foreign keys
    employer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[int | None] = mapped_column(ForeignKey("job_categories.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    employer: Mapped["User"] = relationship(back_populates="jobs")  # type: ignore[name-defined]  # noqa: F821
    category: Mapped["JobCategory | None"] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")  # type: ignore[name-defined]  # noqa: F821
    company: Mapped["Company | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    department: Mapped["Department | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821

    # HNSW index for fast cosine similarity search on job embeddings
    __table_args__ = (
        Index(
            "ix_jobs_embedding_hnsw",
            embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self) -> str:
        return f"<Job {self.title}>"
