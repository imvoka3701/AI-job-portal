"""Change resume embedding dimension from 1536 to 384.

Revision ID: 002
Revises: 001
Create Date: 2026-08-08

- Drops existing HNSW index on resumes.embedding
- Alters column type from vector(1536) → vector(384)
- Re-creates HNSW index with the new dimension
"""

from alembic import op
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic
revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | None = None
depends_on: str | None = None

# New embedding dimension (paraphrase-multilingual-MiniLM-L12-v2)
EMBEDDING_DIM = 384
OLD_EMBEDDING_DIM = 1536


def upgrade() -> None:
    # 1) Drop the existing HNSW index so we can alter the column
    op.execute("DROP INDEX IF EXISTS ix_resumes_embedding_hnsw")

    # 2) Set all existing embeddings to NULL — old 1536-dim data can't be cast
    op.execute("UPDATE resumes SET embedding = NULL")

    # 3) Change column type: vector(1536) → vector(384)
    op.execute(
        f"""
        ALTER TABLE resumes
        ALTER COLUMN embedding TYPE vector({EMBEDDING_DIM})
        USING embedding::vector({EMBEDDING_DIM})
        """
    )

    # 3) Re-create HNSW index for cosine similarity with the new dimension
    op.execute(
        f"""
        CREATE INDEX ix_resumes_embedding_hnsw
        ON resumes
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )


def downgrade() -> None:
    # 1) Drop HNSW index
    op.execute("DROP INDEX IF EXISTS ix_resumes_embedding_hnsw")

    # 2) Revert column type: vector(384) → vector(1536)
    op.execute(
        f"""
        ALTER TABLE resumes
        ALTER COLUMN embedding TYPE vector({OLD_EMBEDDING_DIM})
        USING embedding::vector({OLD_EMBEDDING_DIM})
        """
    )

    # 3) Re-create HNSW index with old dimension
    op.execute(
        f"""
        CREATE INDEX ix_resumes_embedding_hnsw
        ON resumes
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )
