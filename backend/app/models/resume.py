"""Resume ORM model — stores CV data and embedding vector for AI matching."""

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Embedding dimension — paraphrase-multilingual-MiniLM-L12-v2 outputs 384-dimensional vectors
EMBEDDING_DIM = 384


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_skills: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    parsed_experience: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    ai_evaluation_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    # pgvector embedding for AI matching (Cosine Similarity)
    embedding = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

    # Validation gate — True only after passing CV format validation pipeline
    is_validated: Mapped[bool] = mapped_column(default=False)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Structured CV metadata (populated by CVParserService) ────────────────
    parsed_industry: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    desired_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    desired_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parsed_experience_level: Mapped[str | None] = mapped_column(
        String(20), nullable=True, index=True
    )  # "fresher" | "junior" | "middle" | "senior" | "lead"
    parsed_key_skills: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    industry_category_id: Mapped[int | None] = mapped_column(
        ForeignKey("job_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Foreign key
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="resumes")  # type: ignore[name-defined]  # noqa: F821

    # HNSW index for fast cosine similarity search
    __table_args__ = (
        Index(
            "ix_resumes_embedding_hnsw",
            embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self) -> str:
        return f"<Resume {self.title} user={self.user_id}>"
