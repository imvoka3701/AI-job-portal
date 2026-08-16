"""Add embedding column to jobs table for AI matching.

Revision ID: 003
Revises: 002
Create Date: 2026-08-08

- Adds vector(384) embedding column to jobs table
- Creates HNSW index for cosine similarity search on job embeddings
"""

from alembic import op
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic
revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | None = None
depends_on: str | None = None

EMBEDDING_DIM = 384


def upgrade() -> None:
    # 1) Add embedding column
    op.execute(
        f"""
        ALTER TABLE jobs
        ADD COLUMN embedding vector({EMBEDDING_DIM})
        """
    )

    # 2) Create HNSW index for cosine similarity
    op.execute(
        f"""
        CREATE INDEX ix_jobs_embedding_hnsw
        ON jobs
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_jobs_embedding_hnsw")
    op.execute("ALTER TABLE jobs DROP COLUMN IF EXISTS embedding")
