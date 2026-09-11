"""Document Chunk ORM model — stores granular semantic chunks with vector embeddings and full-text indexing for RAG."""

import json
from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.resume import EMBEDDING_DIM


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Multi-tenant isolation fence
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Document reference & classification
    document_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # "resume" | "cv_document" | "job"
    document_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    section_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # "experience" | "project" | "skills" | "education" | "summary" | "requirement" | "responsibility" | "benefit" | "general"
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Chunk content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    # Dense vector embedding (384-dim, cosine similarity)
    embedding = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    user: Mapped["User | None"] = relationship()  # type: ignore[name-defined]  # noqa: F821

    __table_args__ = (
        Index(
            "ix_document_chunks_embedding_hnsw",
            embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index(
            "ix_document_chunks_tenant_doc",
            company_id,
            document_type,
            document_id,
        ),
    )

    @property
    def metadata_dict(self) -> dict[str, Any]:
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    def __repr__(self) -> str:
        return f"<DocumentChunk id={self.id} doc={self.document_type}:{self.document_id} sec={self.section_type}>"
