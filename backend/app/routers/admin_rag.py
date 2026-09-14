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


# ─── Pydantic Request Models ──────────────────────────────────────────────────
class RAGConfigUpdateIn(BaseModel):
    is_rag_enabled: bool | None = None
    hybrid_alpha_dense: float | None = Field(default=None, ge=0.0, le=1.0)
    hybrid_alpha_sparse: float | None = Field(default=None, ge=0.0, le=1.0)
    default_min_score: float | None = Field(default=None, ge=0.0, le=1.0)
    default_top_k: int | None = Field(default=None, ge=1, le=100)
    maintenance_message: str | None = Field(default=None, max_length=500)


class BatchReindexRequest(BaseModel):
    scope: str = Field(default="all", description="'all' | 'resume' | 'cv_document' | 'job'")


class PaginatedSearchLogsOut(BaseModel):
    items: list[RAGSearchLogEntry]
    total: int
    page: int
    page_size: int


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
    summary="Lấy cấu hình thời gian thực của thuật toán Hybrid Search",
)
def get_rag_config(
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
) -> Any:
    return rag_governance_service.get_config()


@router.patch(
    "/config",
    response_model=RAGRuntimeConfig,
    summary="Cân chỉnh trọng số Hybrid và công tắc khẩn cấp Kill-Switch",
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
        target_label="AI RAG Hybrid Configuration",
        details={
            "old_config": old_cfg.model_dump(mode="json"),
            "new_config": updated_cfg.model_dump(mode="json"),
        },
    )
    db.commit()

    return updated_cfg


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
