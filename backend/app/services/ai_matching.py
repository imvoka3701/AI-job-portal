"""AI Matching Service — computes cosine similarity between resume and job embeddings."""

import logging
import math

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.schemas.ai import AIMatchResponse

logger = logging.getLogger(__name__)


def _cosine_similarity_python(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors using pure Python.

    Used as fallback when pgvector is not available (e.g., SQLite tests).
    """
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class AIMatchingService:
    async def compute_match(
        self,
        db: Session,
        *,
        resume: Resume,
        job_embedding: list[float],
    ) -> AIMatchResponse:
        """Compute cosine similarity between a resume embedding and a job embedding."""
        if resume.embedding is None:
            return AIMatchResponse(
                score=0.0,
                explanation="Resume has no embedding. Please upload and parse the CV first.",
                strengths=[],
                gaps=["Resume embedding not generated"],
            )

        resume_embedding: list[float] = resume.embedding  # type: ignore[assignment]

        # Try pgvector first; fall back to Python for SQLite test environments
        try:
            result = db.execute(
                text(
                    "SELECT 1 - ((:job_emb)::vector <=> (SELECT embedding FROM resumes WHERE id = :resume_id))"
                ),
                {"job_emb": str(job_embedding), "resume_id": resume.id},
            )
            similarity = result.scalar() or 0.0
        except Exception:
            logger.debug("pgvector unavailable — using Python cosine similarity fallback")
            similarity = _cosine_similarity_python(job_embedding, resume_embedding)

        return AIMatchResponse(
            score=round(float(similarity) * 100, 2),
            explanation=f"AI matching score based on cosine similarity: {similarity:.4f}",
            strengths=[],
            gaps=[],
        )

    async def find_top_matches(
        self,
        db: Session,
        *,
        job_embedding: list[float],
        limit: int = 10,
    ) -> list[dict]:
        """Find top N resumes most similar to a job embedding using HNSW index."""
        try:
            result = db.execute(
                text(
                    """
                    SELECT id, user_id, title,
                           1 - (embedding <=> :embedding::vector) AS similarity
                    FROM resumes
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> :embedding::vector
                    LIMIT :limit
                    """
                ),
                {"embedding": str(job_embedding), "limit": limit},
            )
            return [
                {
                    "resume_id": row.id,
                    "user_id": row.user_id,
                    "title": row.title,
                    "score": row.similarity,
                }
                for row in result
            ]
        except Exception:
            logger.debug("pgvector unavailable — top matches not supported in test env")
            return []


ai_matching_service = AIMatchingService()
