"""CRUD operations for DocumentChunk model — Multi-tenant Storage, Retrieval, and Hybrid Search."""

import json
import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.schemas.rag import DocumentChunkCreate, RAGSearchResult

logger = logging.getLogger(__name__)


class CRUDDocumentChunk:
    """CRUD manager for DocumentChunk with multi-tenant isolation and hybrid search."""

    def create_chunks(
        self,
        db: Session,
        *,
        chunks_data: list[DocumentChunkCreate],
        embeddings: list[list[float]] | None = None,
    ) -> list[DocumentChunk]:
        """Bulk insert document chunks with precomputed embeddings."""
        if not chunks_data:
            return []

        db_chunks = []
        for idx, item in enumerate(chunks_data):
            emb = embeddings[idx] if (embeddings and idx < len(embeddings)) else None
            chunk = DocumentChunk(
                company_id=item.company_id,
                user_id=item.user_id,
                document_type=item.document_type,
                document_id=item.document_id,
                section_type=item.section_type,
                chunk_index=item.chunk_index,
                content=item.content,
                metadata_json=item.metadata_json,
                embedding=emb,
            )
            db_chunks.append(chunk)

        db.add_all(db_chunks)
        db.commit()
        for chunk in db_chunks:
            db.refresh(chunk)
        return db_chunks

    def delete_chunks_for_document(
        self,
        db: Session,
        *,
        document_type: str,
        document_id: int,
    ) -> int:
        """Atomic deletion of all chunks belonging to a document."""
        deleted = (
            db.query(DocumentChunk)
            .filter(
                DocumentChunk.document_type == document_type,
                DocumentChunk.document_id == document_id,
            )
            .delete(synchronize_session=False)
        )
        db.commit()
        return deleted

    def get_chunks_for_document(
        self,
        db: Session,
        *,
        document_type: str,
        document_id: int,
    ) -> list[DocumentChunk]:
        """Fetch all chunks for a document in sequential order."""
        return (
            db.query(DocumentChunk)
            .filter(
                DocumentChunk.document_type == document_type,
                DocumentChunk.document_id == document_id,
            )
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )

    def hybrid_search(
        self,
        db: Session,
        *,
        query_text: str,
        query_vector: list[float] | None = None,
        document_type: str | None = None,
        company_id: int | None = None,
        user_id: int | None = None,
        section_types: list[str] | None = None,
        limit: int = 5,
        min_score: float = 0.4,
    ) -> list[RAGSearchResult]:
        """Perform Hybrid Search (Dense pgvector Cosine + Sparse BM25 tsvector) with hard tenant isolation."""
        bind = db.get_bind()
        is_postgres = bind.dialect.name == "postgresql"

        if is_postgres and query_vector is not None:
            # PostgreSQL Hybrid Search implementation
            filters = []
            params: dict[str, Any] = {
                "query_text": query_text,
                "limit": limit,
                "min_score": min_score,
                "vector_str": f"[{','.join(str(v) for v in query_vector)}]",
            }

            # Multi-tenant boundary isolation
            if company_id is not None:
                filters.append("(company_id = :company_id OR company_id IS NULL)")
                params["company_id"] = company_id

            if user_id is not None:
                filters.append("user_id = :user_id")
                params["user_id"] = user_id

            if document_type:
                filters.append("document_type = :document_type")
                params["document_type"] = document_type

            if section_types:
                filters.append("section_type = ANY(:section_types)")
                params["section_types"] = section_types

            where_clause = " AND ".join(filters)
            if where_clause:
                where_clause = "WHERE " + where_clause
            else:
                where_clause = ""

            sql_query = text(f"""
                WITH scored_chunks AS (
                    SELECT
                        id,
                        company_id,
                        user_id,
                        document_type,
                        document_id,
                        section_type,
                        chunk_index,
                        content,
                        metadata_json,
                        -- Dense cosine similarity: 1 - (embedding <=> query_vector)
                        COALESCE(1 - (embedding <=> (:vector_str)::vector), 0.0) AS dense_sim,
                        -- Sparse lexical match: ts_rank_cd normalized
                        COALESCE(ts_rank_cd(tsv_content, plainto_tsquery('simple', :query_text)), 0.0) AS sparse_rank
                    FROM document_chunks
                    {where_clause}
                )
                SELECT
                    id,
                    company_id,
                    user_id,
                    document_type,
                    document_id,
                    section_type,
                    chunk_index,
                    content,
                    metadata_json,
                    dense_sim,
                    sparse_rank,
                    -- Hybrid score formula: 70% Dense + 30% Sparse (capped at 1.0)
                    LEAST(1.0, (dense_sim * 0.70) + (LEAST(1.0, sparse_rank) * 0.30)) AS hybrid_score
                FROM scored_chunks
                WHERE (dense_sim >= :min_score OR sparse_rank > 0.05)
                ORDER BY hybrid_score DESC
                LIMIT :limit;
            """)

            rows = db.execute(sql_query, params).fetchall()
            results = []
            for row in rows:
                meta = {}
                if row.metadata_json:
                    try:
                        meta = json.loads(row.metadata_json)
                    except Exception:
                        pass

                results.append(
                    RAGSearchResult(
                        chunk_id=row.id,
                        document_type=row.document_type,
                        document_id=row.document_id,
                        company_id=row.company_id,
                        user_id=row.user_id,
                        section_type=row.section_type,
                        chunk_index=row.chunk_index,
                        content=row.content,
                        metadata=meta,
                        dense_score=round(float(row.dense_sim), 4),
                        sparse_score=round(float(row.sparse_rank), 4),
                        hybrid_score=round(float(row.hybrid_score), 4),
                    )
                )
            return results

        else:
            # Fallback for SQLite in-memory testing or non-vector queries
            query = db.query(DocumentChunk)
            if company_id is not None:
                query = query.filter((DocumentChunk.company_id == company_id) | (DocumentChunk.company_id.is_(None)))
            if user_id is not None:
                query = query.filter(DocumentChunk.user_id == user_id)
            if document_type:
                query = query.filter(DocumentChunk.document_type == document_type)
            if section_types:
                query = query.filter(DocumentChunk.section_type.in_(section_types))

            # Simple substring matching
            keywords = [w.lower() for w in query_text.split() if len(w) > 2]
            all_chunks = query.limit(limit * 3).all()

            results = []
            for c in all_chunks:
                text_lower = c.content.lower()
                matches = sum(1 for kw in keywords if kw in text_lower)
                score = min(1.0, max(0.4, matches / max(1, len(keywords))))
                if score >= min_score or matches > 0:
                    results.append(
                        RAGSearchResult(
                            chunk_id=c.id,
                            document_type=c.document_type,
                            document_id=c.document_id,
                            company_id=c.company_id,
                            user_id=c.user_id,
                            section_type=c.section_type,
                            chunk_index=c.chunk_index,
                            content=c.content,
                            metadata=c.metadata_dict,
                            dense_score=round(score, 4),
                            sparse_score=round(float(matches), 4),
                            hybrid_score=round(score, 4),
                        )
                    )

            results.sort(key=lambda r: r.hybrid_score, reverse=True)
            return results[:limit]


crud_document_chunk = CRUDDocumentChunk()
