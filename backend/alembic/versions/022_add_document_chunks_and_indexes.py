"""Add document_chunks table with HNSW vector index and GIN tsvector index for RAG.

Revision ID: 022
Revises: 021
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision: str = "022"
down_revision: str | None = "021"
branch_labels: str | None = None
depends_on: str | None = None

EMBEDDING_DIM = 384


def upgrade() -> None:
    # 1. Create table
    op.create_table(
        "document_chunks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "company_id",
            sa.Integer(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("document_type", sa.String(length=30), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("section_type", sa.String(length=50), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # 2. Add pgvector vector and tsvector columns (Postgres-specific execution)
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            f"""
            ALTER TABLE document_chunks
            ADD COLUMN embedding vector({EMBEDDING_DIM}),
            ADD COLUMN tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;
            """
        )
        # 3. Create HNSW Cosine vector index
        op.execute(
            """
            CREATE INDEX ix_document_chunks_embedding_hnsw
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
            """
        )
        # 4. Create GIN index for Sparse Full-text keyword search
        op.execute(
            """
            CREATE INDEX ix_document_chunks_tsv
            ON document_chunks
            USING gin (tsv_content);
            """
        )
    else:
        # SQLite fallback for test suites
        op.add_column("document_chunks", sa.Column("embedding", sa.Text(), nullable=True))
        op.add_column("document_chunks", sa.Column("tsv_content", sa.Text(), nullable=True))

    # 5. Standard B-Tree Indexes for multi-tenant and metadata filtering
    op.create_index(
        "ix_document_chunks_tenant_doc",
        "document_chunks",
        ["company_id", "document_type", "document_id"],
    )
    op.create_index("ix_document_chunks_user", "document_chunks", ["user_id"])
    op.create_index("ix_document_chunks_section", "document_chunks", ["section_type"])
    op.create_index("ix_document_chunks_doc_ref", "document_chunks", ["document_type", "document_id"])


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS ix_document_chunks_tsv;")
        op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw;")
    
    op.drop_index("ix_document_chunks_doc_ref", table_name="document_chunks")
    op.drop_index("ix_document_chunks_section", table_name="document_chunks")
    op.drop_index("ix_document_chunks_user", table_name="document_chunks")
    op.drop_index("ix_document_chunks_tenant_doc", table_name="document_chunks")
    op.drop_table("document_chunks")
