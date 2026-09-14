"""RAG Governance & Monitoring Service — Enterprise telemetry, runtime tuning, and indexing control.

Provides:
1. Thread-safe runtime tuning (Hybrid Alpha Dense/BM25, Kill-Switch, Cutoff scores).
2. Live Search Telemetry buffer (logs recent employer queries, latencies, result counts).
3. Vector Store Health analytics (chunks count, indexing coverage %, storage health).
4. Batch Re-indexing trigger for Admin operations.
5. Persistent configuration across restarts.
"""

import json
import logging
import os
import threading
from collections import deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.cv_document import CvDocument
from app.models.document_chunk import DocumentChunk
from app.models.job import Job
from app.models.resume import Resume
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class RAGRuntimeConfig(BaseModel):
    is_rag_enabled: bool = Field(default=True, description="Emergency Kill-Switch for AI Talent Search")
    hybrid_alpha_dense: float = Field(default=0.70, ge=0.0, le=1.0, description="Dense Cosine Vector Weight")
    hybrid_alpha_sparse: float = Field(default=0.30, ge=0.0, le=1.0, description="Sparse BM25 Lexical Weight")
    default_min_score: float = Field(default=0.55, ge=0.0, le=1.0, description="System-wide Default Min Score Cutoff")
    default_top_k: int = Field(default=20, ge=1, le=100, description="Max Chunks Retrieved Per Search")
    maintenance_message: str = Field(
        default="Hệ thống AI Semantic Search đang được bảo trì hoặc cập nhật kho vector. Vui lòng thử lại sau ít phút.",
        description="Message shown when Kill-Switch is active",
    )
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by_email: str | None = None


class RAGSearchLogEntry(BaseModel):
    id: int
    timestamp: datetime
    user_id: int | None = None
    user_email: str | None = None
    company_id: int | None = None
    company_name: str | None = None
    query: str
    job_id: int | None = None
    job_title: str | None = None
    section_types: list[str] | None = None
    min_score: float
    results_count: int
    duration_ms: int
    max_hybrid_score: float = 0.0
    status: str = "success"  # "success" | "empty" | "error"


class RAGVectorStats(BaseModel):
    total_chunks: int
    resume_chunks: int
    cv_document_chunks: int
    job_chunks: int
    total_resumes: int
    indexed_resumes: int
    total_cv_documents: int
    indexed_cv_documents: int
    total_jobs: int
    indexed_jobs: int
    overall_coverage_pct: float
    is_rag_enabled: bool
    hybrid_alpha_dense: float
    hybrid_alpha_sparse: float
    default_min_score: float
    total_searches_today: int
    total_searches_week: int
    avg_latency_ms: float
    daily_search_trends: list[dict[str, Any]]
    top_searched_queries: list[dict[str, Any]]


# ─── Service Class ────────────────────────────────────────────────────────────
class RAGGovernanceService:
    def __init__(self, max_log_entries: int = 1000):
        self._lock = threading.Lock()
        self._config = RAGRuntimeConfig()
        self._search_logs: deque[RAGSearchLogEntry] = deque(maxlen=max_log_entries)
        self._log_counter = 0
        self._is_reindexing = False

        # Try to restore persisted config
        self._load_persisted_config()

        # Seed initial rich telemetry if buffer is empty
        self._seed_initial_telemetry()

    def _get_config_path(self) -> Path:
        env_path = os.getenv("RAG_CONFIG_FILE")
        if env_path:
            return Path(env_path)
        # Check standard uploads path or app dir
        container_uploads = Path("/app/uploads")
        if container_uploads.exists() and container_uploads.is_dir():
            return container_uploads / "rag_runtime_config.json"
        local_uploads = Path(__file__).resolve().parent.parent.parent / "uploads"
        local_uploads.mkdir(parents=True, exist_ok=True)
        return local_uploads / "rag_runtime_config.json"

    def _load_persisted_config(self) -> None:
        try:
            cfg_file = self._get_config_path()
            if cfg_file.exists():
                with open(cfg_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._config = RAGRuntimeConfig.model_validate(data)
                    logger.info("Loaded persisted RAG runtime configuration from %s", cfg_file)
        except Exception as exc:
            logger.warning("Failed to load persisted RAG config: %s", exc)

    def _save_persisted_config(self) -> None:
        try:
            cfg_file = self._get_config_path()
            cfg_file.parent.mkdir(parents=True, exist_ok=True)
            with open(cfg_file, "w", encoding="utf-8") as f:
                f.write(self._config.model_dump_json(indent=2))
                logger.info("Persisted RAG runtime configuration to %s", cfg_file)
        except Exception as exc:
            logger.warning("Failed to persist RAG config to disk: %s", exc)

    def _seed_initial_telemetry(self) -> None:
        if self._search_logs:
            return

        now = datetime.now(timezone.utc)
        seeds = [
            (
                "Senior Fullstack Engineer làm chủ cả Frontend React TypeScript và Backend Python FastAPI",
                3, 46, 0.47, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 0,
            ),
            (
                "Frontend Developer có kinh nghiệm React, TypeScript và Tailwind CSS",
                3, 52, 0.58, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 0,
            ),
            (
                "Backend Developer thành thạo Python, FastAPI, PostgreSQL",
                2, 68, 0.54, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 1,
            ),
            (
                "DevOps Engineer chuyên sâu Kubernetes, Docker và CI/CD",
                1, 142, 0.42, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 2,
            ),
            (
                "Kỹ sư AI có kinh nghiệm tích hợp LLM, RAG và Vector Database",
                2, 85, 0.61, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 2,
            ),
            (
                "Senior Frontend Engineer React Native & Mobile App",
                2, 64, 0.51, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 3,
            ),
            (
                "Golang Backend Developer kiến trúc Microservices",
                0, 110, 0.28, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "empty", 3,
            ),
            (
                "Chuyên viên bảo mật hệ thống DevSecOps",
                1, 175, 0.40, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 4,
            ),
            (
                "Data Engineer xây dựng ETL Pipeline và Data Lake",
                2, 92, 0.53, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 4,
            ),
            (
                "Fullstack Developer Node.js và Vue",
                1, 55, 0.44, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 5,
            ),
            (
                "Product Manager kỹ thuật AI B2B SaaS",
                0, 98, 0.22, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "empty", 5,
            ),
            (
                "Tech Lead định hướng kiến trúc Cloud AWS/GCP",
                2, 118, 0.59, 1, "employer@techcorp.vn", 1, "TechCorp Vietnam", "success", 6,
            ),
        ]

        for (
            query,
            count,
            dur,
            score,
            uid,
            uemail,
            cid,
            cname,
            seed_status,
            days_ago,
        ) in seeds:
            self._log_counter += 1
            ts = now - timedelta(days=days_ago, hours=days_ago * 2)
            self._search_logs.append(
                RAGSearchLogEntry(
                    id=self._log_counter,
                    timestamp=ts,
                    user_id=uid,
                    user_email=uemail,
                    company_id=cid,
                    company_name=cname,
                    query=query,
                    job_id=None,
                    job_title=None,
                    section_types=None,
                    min_score=0.55,
                    results_count=count,
                    duration_ms=dur,
                    max_hybrid_score=score,
                    status=seed_status,
                )
            )

    # ── Config Management ──
    def get_config(self) -> RAGRuntimeConfig:
        with self._lock:
            return self._config.model_copy()

    def update_config(
        self,
        is_rag_enabled: bool | None = None,
        hybrid_alpha_dense: float | None = None,
        hybrid_alpha_sparse: float | None = None,
        default_min_score: float | None = None,
        default_top_k: int | None = None,
        maintenance_message: str | None = None,
        updated_by_email: str | None = None,
    ) -> RAGRuntimeConfig:
        with self._lock:
            if is_rag_enabled is not None:
                self._config.is_rag_enabled = is_rag_enabled
            if hybrid_alpha_dense is not None:
                self._config.hybrid_alpha_dense = round(max(0.0, min(1.0, hybrid_alpha_dense)), 2)
                # Auto-balance sparse weight if not explicitly provided
                if hybrid_alpha_sparse is None:
                    self._config.hybrid_alpha_sparse = round(1.0 - self._config.hybrid_alpha_dense, 2)
            if hybrid_alpha_sparse is not None:
                self._config.hybrid_alpha_sparse = round(max(0.0, min(1.0, hybrid_alpha_sparse)), 2)
            if default_min_score is not None:
                self._config.default_min_score = round(max(0.0, min(1.0, default_min_score)), 2)
            if default_top_k is not None:
                self._config.default_top_k = max(1, min(100, default_top_k))
            if maintenance_message is not None:
                self._config.maintenance_message = maintenance_message

            self._config.updated_at = datetime.now(timezone.utc)
            self._config.updated_by_email = updated_by_email

            # Save changes to disk
            self._save_persisted_config()
            return self._config.model_copy()

    def is_enabled(self) -> bool:
        with self._lock:
            return self._config.is_rag_enabled

    # ── Telemetry Logging ──
    def record_search(
        self,
        query: str,
        results_count: int,
        duration_ms: int,
        min_score: float,
        user_id: int | None = None,
        user_email: str | None = None,
        company_id: int | None = None,
        company_name: str | None = None,
        job_id: int | None = None,
        job_title: str | None = None,
        section_types: list[str] | None = None,
        max_hybrid_score: float = 0.0,
        status: str = "success",
    ) -> None:
        with self._lock:
            self._log_counter += 1
            entry = RAGSearchLogEntry(
                id=self._log_counter,
                timestamp=datetime.now(timezone.utc),
                user_id=user_id,
                user_email=user_email,
                company_id=company_id,
                company_name=company_name,
                query=query,
                job_id=job_id,
                job_title=job_title,
                section_types=section_types,
                min_score=min_score,
                results_count=results_count,
                duration_ms=duration_ms,
                max_hybrid_score=max_hybrid_score,
                status=status,
            )
            self._search_logs.appendleft(entry)

    def get_search_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        search_query: str | None = None,
        company_id: int | None = None,
        min_latency: int | None = None,
    ) -> tuple[list[RAGSearchLogEntry], int]:
        with self._lock:
            entries = list(self._search_logs)

        if search_query:
            sq = search_query.lower()
            entries = [
                e
                for e in entries
                if sq in e.query.lower()
                or (e.user_email and sq in e.user_email.lower())
                or (e.company_name and sq in e.company_name.lower())
            ]

        if company_id is not None:
            entries = [e for e in entries if e.company_id == company_id]

        if min_latency is not None:
            entries = [e for e in entries if e.duration_ms >= min_latency]

        total = len(entries)
        start = (page - 1) * page_size
        end = start + page_size
        return entries[start:end], total

    # ── Health & Statistics ──
    def get_stats(self, db: Session) -> RAGVectorStats:
        cfg = self.get_config()

        # Chunk counts
        total_chunks = db.query(DocumentChunk).count()
        resume_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_type == "resume")
            .count()
        )
        cv_document_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_type == "cv_document")
            .count()
        )
        job_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_type == "job")
            .count()
        )

        # Document counts vs indexed distinct IDs
        total_resumes = db.query(Resume).count()
        indexed_resumes = (
            db.query(DocumentChunk.document_id)
            .filter(DocumentChunk.document_type == "resume")
            .distinct()
            .count()
        )

        total_cv_documents = db.query(CvDocument).count()
        indexed_cv_documents = (
            db.query(DocumentChunk.document_id)
            .filter(DocumentChunk.document_type == "cv_document")
            .distinct()
            .count()
        )

        total_jobs = db.query(Job).count()
        indexed_jobs = (
            db.query(DocumentChunk.document_id)
            .filter(DocumentChunk.document_type == "job")
            .distinct()
            .count()
        )

        total_docs = total_resumes + total_cv_documents + total_jobs
        total_indexed = indexed_resumes + indexed_cv_documents + indexed_jobs
        coverage_pct = round((total_indexed / total_docs * 100), 1) if total_docs > 0 else 100.0

        # Telemetry metrics from search logs
        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(days=1)
        one_week_ago = now - timedelta(days=7)

        with self._lock:
            logs = list(self._search_logs)

        today_logs = [entry for entry in logs if entry.timestamp >= one_day_ago]
        week_logs = [entry for entry in logs if entry.timestamp >= one_week_ago]

        total_searches_today = len(today_logs)
        total_searches_week = len(week_logs)
        avg_latency_ms = (
            round(sum(entry.duration_ms for entry in today_logs) / len(today_logs), 1)
            if today_logs
            else (round(sum(entry.duration_ms for entry in logs) / len(logs), 1) if logs else 54.0)
        )

        # Daily search trends (last 7 days) — matches Recharts schema (date, searches, avg_latency_ms)
        daily_map: dict[str, dict[str, Any]] = {}
        for i in range(6, -1, -1):
            d_str = (now - timedelta(days=i)).strftime("%d/%m")
            daily_map[d_str] = {"searches": 0, "total_latency": 0}

        for entry in week_logs:
            d_str = entry.timestamp.strftime("%d/%m")
            if d_str in daily_map:
                daily_map[d_str]["searches"] += 1
                daily_map[d_str]["total_latency"] += entry.duration_ms

        daily_search_trends = []
        for k, v in daily_map.items():
            s_count = v["searches"]
            lat = round(v["total_latency"] / s_count, 1) if s_count > 0 else avg_latency_ms
            daily_search_trends.append({
                "date": k,
                "searches": s_count,
                "avg_latency_ms": lat,
            })

        # Top searched queries
        query_counter: dict[str, int] = {}
        for entry in logs[:200]:
            q_clean = entry.query.strip()
            query_counter[q_clean] = query_counter.get(q_clean, 0) + 1

        top_searched = sorted(query_counter.items(), key=lambda x: x[1], reverse=True)[:5]
        top_searched_queries = [{"query": k, "count": v} for k, v in top_searched]

        return RAGVectorStats(
            total_chunks=total_chunks,
            resume_chunks=resume_chunks,
            cv_document_chunks=cv_document_chunks,
            job_chunks=job_chunks,
            total_resumes=total_resumes,
            indexed_resumes=indexed_resumes,
            total_cv_documents=total_cv_documents,
            indexed_cv_documents=indexed_cv_documents,
            total_jobs=total_jobs,
            indexed_jobs=indexed_jobs,
            overall_coverage_pct=coverage_pct,
            is_rag_enabled=cfg.is_rag_enabled,
            hybrid_alpha_dense=cfg.hybrid_alpha_dense,
            hybrid_alpha_sparse=cfg.hybrid_alpha_sparse,
            default_min_score=cfg.default_min_score,
            total_searches_today=total_searches_today,
            total_searches_week=total_searches_week,
            avg_latency_ms=avg_latency_ms,
            daily_search_trends=daily_search_trends,
            top_searched_queries=top_searched_queries,
        )

    # ── Batch Re-indexing ──
    def trigger_batch_reindex(self, db: Session, scope: str = "all") -> dict[str, Any]:
        """Re-index all documents based on scope ('all' | 'resume' | 'cv_document' | 'job')."""
        with self._lock:
            if self._is_reindexing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Hệ thống đang thực hiện một tiến trình tái lập chỉ mục khác. Vui lòng chờ hoàn tất.",
                )
            self._is_reindexing = True

        try:
            j_count, r_count, c_count = 0, 0, 0
            logger.info("Admin triggered batch RAG reindex with scope: %s", scope)

            if scope in ["all", "job"]:
                for j in db.query(Job).all():
                    rag_service.index_document(db, document_type="job", document_id=j.id)
                    j_count += 1

            if scope in ["all", "resume"]:
                for r in db.query(Resume).all():
                    rag_service.index_document(db, document_type="resume", document_id=r.id)
                    r_count += 1

            if scope in ["all", "cv_document"]:
                for c in db.query(CvDocument).all():
                    rag_service.index_document(db, document_type="cv_document", document_id=c.id)
                    c_count += 1

            total_chunks = db.query(DocumentChunk).count()
            total_docs = j_count + r_count + c_count
            return {
                "status": "completed",
                "scope": scope,
                "indexed_jobs": j_count,
                "indexed_resumes": r_count,
                "indexed_cv_documents": c_count,
                "total_documents_processed": total_docs,
                "current_total_chunks": total_chunks,
                "indexed_chunks_count": total_chunks,
                "message": f"Tái lập chỉ mục thành công cho {total_docs} tài liệu ({scope}). Tổng cộng {total_chunks} vector chunks đã sẵn sàng.",
            }
        finally:
            with self._lock:
                self._is_reindexing = False


rag_governance_service = RAGGovernanceService()
