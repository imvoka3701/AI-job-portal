"""RAG Router — Semantic Hybrid Search, Grounded Interview Question Generation, and Indexing."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.company import Company, CompanyMembership
from app.models.cv_document import CvDocument
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.schemas.rag import (
    RAGCVChatRequest,
    RAGCVChatResponse,
    RAGInterviewQuestionsRequest,
    RAGInterviewQuestionsResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG (Retrieval-Augmented Generation)"])


@router.post(
    "/search",
    response_model=RAGQueryResponse,
    summary="Hybrid Semantic Search (Dense Vector + Sparse BM25)",
    description="Tìm kiếm ngữ nghĩa kết hợp lọc từ khóa chính xác và cách ly Multi-tenant.",
)
def hybrid_search(
    payload: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    # If user is employer and searching jobs, enforce tenant boundary to their company_id
    if current_user.role == UserRole.EMPLOYER and payload.document_type == "job":
        membership = db.query(CompanyMembership).filter(CompanyMembership.user_id == current_user.id).first()
        if membership:
            payload.company_id = membership.company_id
        else:
            comp = db.query(Company).filter(Company.created_by_user_id == current_user.id).first()
            if comp:
                payload.company_id = comp.id

    results = rag_service.search(db, payload)
    return RAGQueryResponse(
        query=payload.query,
        results=results,
        total_matched=len(results),
    )


@router.post(
    "/interview-questions",
    response_model=RAGInterviewQuestionsResponse,
    summary="Generate Grounded Interview Questions",
    description="Sinh câu hỏi phỏng vấn thực chiến bám sát chứng cứ trong hồ sơ ứng viên và yêu cầu JD.",
)
async def generate_interview_questions(
    payload: RAGInterviewQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    # Security check: verify job exists
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy việc làm #{payload.job_id}",
        )

    # Employer tenant check
    if current_user.role == UserRole.EMPLOYER:
        is_authorized = (job.employer_id == current_user.id)
        if not is_authorized and job.company_id:
            membership = db.query(CompanyMembership).filter(
                CompanyMembership.user_id == current_user.id,
                CompanyMembership.company_id == job.company_id,
            ).first()
            if membership:
                is_authorized = True
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập dữ liệu phỏng vấn của tin tuyển dụng này.",
            )

    try:
        response = await rag_service.generate_grounded_interview_questions(db, payload)
        return response
    except Exception as exc:
        logger.exception("Error in RAG interview question generation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể tạo câu hỏi phỏng vấn RAG: {str(exc)}",
        )


@router.post(
    "/chat-cv",
    response_model=RAGCVChatResponse,
    summary="CV Copilot RAG Chat",
    description="Hỏi đáp thông minh về hồ sơ ứng viên với trích dẫn chứng cứ chính xác từ các đoạn phân đoạn.",
)
async def chat_with_cv(
    payload: RAGCVChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    # Security: If user is candidate, verify they own the resume/cv_document
    if current_user.role == UserRole.CANDIDATE:
        if payload.cv_document_id:
            cv = db.query(CvDocument).filter(CvDocument.id == payload.cv_document_id).first()
            if not cv or cv.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không có quyền truy vấn hồ sơ này.",
                )
        elif payload.resume_id:
            res = db.query(Resume).filter(Resume.id == payload.resume_id).first()
            if not res or res.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không có quyền truy vấn hồ sơ này.",
                )

    try:
        response = await rag_service.chat_with_cv(db, payload)
        return response
    except Exception as exc:
        logger.exception("Error in CV Copilot chat: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể xử lý hội thoại CV Copilot: {str(exc)}",
        )


@router.post(
    "/index",
    summary="Index document chunks",
    description="Phân đoạn ngữ nghĩa và sinh vector embedding cho một tài liệu (resume / cv_document / job).",
)
def index_document(
    document_type: str = Query(..., description="'resume' | 'cv_document' | 'job'"),
    document_id: int = Query(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    count = rag_service.index_document(db, document_type=document_type, document_id=document_id)
    return {
        "status": "success",
        "document_type": document_type,
        "document_id": document_id,
        "chunks_indexed": count,
    }


@router.post(
    "/ingest-all",
    summary="Batch Ingest All Documents (Admin / TechLead utility)",
    description="Tự động duyệt và phân đoạn toàn bộ Jobs, Resumes, và CV Documents hiện có trong CSDL.",
)
def batch_ingest_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if current_user.role != UserRole.ADMIN and current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Quản trị viên hoặc Nhà tuyển dụng mới có quyền kích hoạt batch ingest.",
        )

    indexed_jobs = 0
    jobs = db.query(Job).all()
    for j in jobs:
        try:
            rag_service.index_document(db, document_type="job", document_id=j.id)
            indexed_jobs += 1
        except Exception as e:
            logger.warning("Failed indexing job %s: %s", j.id, e)

    indexed_resumes = 0
    resumes = db.query(Resume).all()
    for r in resumes:
        try:
            rag_service.index_document(db, document_type="resume", document_id=r.id)
            indexed_resumes += 1
        except Exception as e:
            logger.warning("Failed indexing resume %s: %s", r.id, e)

    indexed_cv_docs = 0
    cv_docs = db.query(CvDocument).all()
    for c in cv_docs:
        try:
            rag_service.index_document(db, document_type="cv_document", document_id=c.id)
            indexed_cv_docs += 1
        except Exception as e:
            logger.warning("Failed indexing cv_doc %s: %s", c.id, e)

    return {
        "status": "completed",
        "jobs_indexed": indexed_jobs,
        "resumes_indexed": indexed_resumes,
        "cv_documents_indexed": indexed_cv_docs,
    }
