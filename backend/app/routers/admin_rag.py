"""Admin RAG Router — Vector Store Monitoring, Algorithm Tuning, Batch Re-indexing, and Search Audit."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.core.rate_limiter import rate_limit
from app.crud.admin_audit_log import crud_admin_audit_log
from app.database import get_db
from app.models.user import User, UserRole
from app.services.rag_governance_service import (
    RAGRuntimeConfig,
    RAGSearchLogEntry,
    RAGVectorStats,
    rag_governance_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin/rag",
    tags=["Admin — RAG Governance & Vector Control"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# ─── Pydantic Request & Response Models ───────────────────────────────────────
class RAGConfigUpdateIn(BaseModel):
    is_rag_enabled: bool | None = None
    hybrid_alpha_dense: float | None = Field(default=None, ge=0.0, le=1.0)
    hybrid_alpha_sparse: float | None = Field(default=None, ge=0.0, le=1.0)
    default_min_score: float | None = Field(default=None, ge=0.0, le=1.0)
    default_top_k: int | None = Field(default=None, ge=1, le=100)
    maintenance_message: str | None = Field(default=None, max_length=500)
    chunk_size: int | None = Field(default=None, ge=200, le=3000)
    chunk_overlap: int | None = Field(default=None, ge=0, le=500)
    min_chunk_length: int | None = Field(default=None, ge=10, le=200)
    chunking_strategy: str | None = Field(default=None)


class BatchReindexRequest(BaseModel):
    scope: str = Field(default="all", description="'all' | 'resume' | 'cv_document' | 'job'")


class PaginatedSearchLogsOut(BaseModel):
    items: list[RAGSearchLogEntry]
    total: int
    page: int
    page_size: int


class SimulateChunkItem(BaseModel):
    chunk_index: int
    section_type: str
    char_count: int
    word_count: int
    preview: str
    content: str
    metadata: dict[str, Any]


class SimulateChunkingIn(BaseModel):
    document_type: str = Field(default="cv_document", description="'cv_document' | 'resume' | 'job'")
    text: str | None = None
    content_json: dict[str, Any] | None = None
    chunk_size: int | None = Field(default=None, ge=200, le=3000)
    chunk_overlap: int | None = Field(default=None, ge=0, le=500)
    min_chunk_length: int | None = Field(default=None, ge=10, le=200)


class SimulateChunkingOut(BaseModel):
    document_type: str
    total_chunks: int
    total_characters: int | None = None
    average_chunk_size: float
    effective_chunk_size: int
    effective_chunk_overlap: int
    effective_min_length: int
    warnings: list[str]
    chunks: list[SimulateChunkItem]


class DocumentChunkDetailOut(BaseModel):
    id: int
    chunk_index: int
    section_type: str
    char_count: int
    content: str
    has_embedding: bool
    created_at: str | None = None
    metadata: dict[str, Any] | None = None


class DocumentChunksResponse(BaseModel):
    document_type: str
    document_id: int
    document_title: str
    owner_email: str | None = None
    is_validated: bool | None = True
    status: str | None = None
    total_chunks: int
    chunks: list[DocumentChunkDetailOut]


class DocumentReindexResponse(BaseModel):
    status: str
    document_type: str
    document_id: int
    indexed_chunks_count: int
    message: str


class DocumentPurgeResponse(BaseModel):
    status: str
    document_type: str
    document_id: int
    chunks_deleted: int


class OrphanStatsOut(BaseModel):
    total_orphans: int
    orphan_resume_chunks: int
    orphan_cv_document_chunks: int
    orphan_job_chunks: int
    orphan_chunk_ids: list[int]


class PurgeOrphansOut(BaseModel):
    status: str
    purged_count: int
    message: str


# ─── Endpoints ────────────────────────────────────────────────────────────────
@router.get(
    "/stats",
    response_model=RAGVectorStats,
    summary="Thống kê tổng quan kho Vector và độ trễ tìm kiếm AI RAG",
)
def get_rag_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    return rag_governance_service.get_stats(db)


@router.get(
    "/config",
    response_model=RAGRuntimeConfig,
    summary="Lấy cấu hình thời gian thực của thuật toán Hybrid Search & Chunking",
)
def get_rag_config(
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    return rag_governance_service.get_config()


@router.patch(
    "/config",
    response_model=RAGRuntimeConfig,
    summary="Cân chỉnh trọng số Hybrid, Chunking parameters và Kill-Switch",
)
def update_rag_config(
    payload: RAGConfigUpdateIn,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    old_cfg = rag_governance_service.get_config()
    updated_cfg = rag_governance_service.update_config(
        is_rag_enabled=payload.is_rag_enabled,
        hybrid_alpha_dense=payload.hybrid_alpha_dense,
        hybrid_alpha_sparse=payload.hybrid_alpha_sparse,
        default_min_score=payload.default_min_score,
        default_top_k=payload.default_top_k,
        maintenance_message=payload.maintenance_message,
        chunk_size=payload.chunk_size,
        chunk_overlap=payload.chunk_overlap,
        min_chunk_length=payload.min_chunk_length,
        chunking_strategy=payload.chunking_strategy,
        updated_by_email=current_admin.email,
    )

    # Immutable Audit Log
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="rag_config.updated",
        target_type="system_config",
        target_id="rag_runtime",
        target_label="AI RAG Hybrid & Chunking Configuration",
        details={
            "old_config": old_cfg.model_dump(mode="json"),
            "new_config": updated_cfg.model_dump(mode="json"),
        },
    )
    db.commit()

    return updated_cfg


@router.post(
    "/simulate-chunking",
    response_model=SimulateChunkingOut,
    summary="Mô phỏng phân mảnh (Chunking Sandbox) thời gian thực không ghi DB",
)
def simulate_chunking(
    payload: SimulateChunkingIn,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    try:
        return rag_governance_service.simulate_chunking(
            document_type=payload.document_type,
            text=payload.text,
            content_json=payload.content_json,
            chunk_size=payload.chunk_size,
            chunk_overlap=payload.chunk_overlap,
            min_chunk_length=payload.min_chunk_length,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/documents/{document_type}/{document_id}/chunks",
    response_model=DocumentChunksResponse,
    summary="Soi chiếu chi tiết toàn bộ các chunk đã lập chỉ mục của một tài liệu",
)
def get_document_chunks_inspection(
    document_type: str,
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    try:
        return rag_governance_service.get_document_chunks(
            db=db,
            document_type=document_type,
            document_id=document_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/documents/{document_type}/{document_id}/reindex",
    response_model=DocumentReindexResponse,
    summary="Tái lập chỉ mục đơn lẻ (Surgical Re-index) cho một tài liệu cụ thể",
    dependencies=[Depends(rate_limit("admin_heavy_ops"))],
)
def reindex_single_document(
    document_type: str,
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    try:
        result = rag_governance_service.reindex_single_document(
            db=db,
            document_type=document_type,
            document_id=document_id,
        )
        # Audit Log
        crud_admin_audit_log.create(
            db,
            actor_user_id=current_admin.id,
            actor_email=current_admin.email,
            action="rag_document.surgical_reindex",
            target_type=document_type,
            target_id=str(document_id),
            target_label=f"Surgical Reindex ({document_type} #{document_id})",
            details=result,
        )
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/documents/{document_type}/{document_id}/chunks",
    response_model=DocumentPurgeResponse,
    summary="Thu hồi toàn bộ chunk vector của tài liệu khỏi kho tìm kiếm RAG",
)
def delete_document_chunks(
    document_type: str,
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    try:
        result = rag_governance_service.delete_document_chunks(
            db=db,
            document_type=document_type,
            document_id=document_id,
        )
        # Audit Log
        crud_admin_audit_log.create(
            db,
            actor_user_id=current_admin.id,
            actor_email=current_admin.email,
            action="rag_document.chunks_purged",
            target_type=document_type,
            target_id=str(document_id),
            target_label=f"Purge Document Chunks ({document_type} #{document_id})",
            details=result,
        )
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/orphans",
    response_model=OrphanStatsOut,
    summary="Chẩn đoán vector mồ côi (Orphan Chunks không còn bản ghi gốc)",
)
def get_orphan_chunks_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    return rag_governance_service.get_orphan_chunks_stats(db)


@router.post(
    "/purge-orphans",
    response_model=PurgeOrphansOut,
    summary="Dọn dẹp triệt để các vector mồ côi giải phóng dung lượng pgvector",
    dependencies=[Depends(rate_limit("admin_heavy_ops"))],
)
def purge_orphan_chunks(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    result = rag_governance_service.purge_orphan_chunks(db)
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="rag_vector.orphans_purged",
        target_type="document_chunks",
        target_id="orphan_cleanup",
        target_label="Purge Orphan Vector Chunks",
        details=result,
    )
    db.commit()
    return result


@router.post(
    "/reindex-batch",
    summary="Kích hoạt tái lập chỉ mục Vector hàng loạt cho kho dữ liệu",
    dependencies=[Depends(rate_limit("admin_heavy_ops"))],
)
def trigger_batch_reindex(
    payload: BatchReindexRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    valid_scopes = ["all", "resume", "cv_document", "job"]
    if payload.scope not in valid_scopes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phạm vi không hợp lệ. Chọn 1 trong: {', '.join(valid_scopes)}",
        )

    result = rag_governance_service.trigger_batch_reindex(db, scope=payload.scope)

    # Immutable Audit Log
    crud_admin_audit_log.create(
        db,
        actor_user_id=current_admin.id,
        actor_email=current_admin.email,
        action="rag_index.reindexed",
        target_type="document_chunks",
        target_id=payload.scope,
        target_label=f"RAG Batch Reindex ({payload.scope})",
        details=result,
    )
    db.commit()

    return result


@router.get(
    "/search-logs",
    response_model=PaginatedSearchLogsOut,
    summary="Nhật ký truy vấn tìm kiếm nhân tài của Nhà tuyển dụng",
)
def list_search_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None, description="Tìm theo từ khóa truy vấn, email hoặc công ty"),
    company_id: int | None = Query(default=None),
    min_latency: int | None = Query(default=None, description="Lọc thời gian phản hồi tối thiểu (ms)"),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    items, total = rag_governance_service.get_search_logs(
        page=page,
        page_size=page_size,
        search_query=q,
        company_id=company_id,
        min_latency=min_latency,
    )
    return PaginatedSearchLogsOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
