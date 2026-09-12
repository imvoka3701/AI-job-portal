"""RAG Router — Semantic Hybrid Search, Grounded Interview Question Generation, and Indexing."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.company_permissions import CompanyPermission, build_company_context
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.application import Application
from app.models.cv_document import CvDocument, CvDocumentStatus
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
    # 1. Candidate Boundary Isolation: A candidate must NEVER see another candidate's private resumes/CVs
    if current_user.role == UserRole.CANDIDATE:
        if payload.document_type in ["resume", "cv_document"] or payload.document_type is None:
            payload.user_id = current_user.id
            payload.exclude_drafts = False  # Candidate can search their own draft CVs
        payload.company_id = None

    # 2. Employer Boundary Isolation: Verify active company context & permission
    elif current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        if not context.has(CompanyPermission.AI_RECRUITMENT) and not context.has(CompanyPermission.APPLICATION_VIEW):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền sử dụng tính năng tìm kiếm AI tuyển dụng.",
            )
        if payload.document_type == "job":
            payload.company_id = context.company.id
        elif payload.document_type in ["resume", "cv_document"]:
            # Employer can only search published CVs in the public talent pool
            payload.exclude_drafts = True
            payload.user_id = None

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
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy việc làm #{payload.job_id}",
        )

    # Employer tenant and application relationship check
    if current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        if not context.has(CompanyPermission.AI_RECRUITMENT):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền sử dụng tính năng AI phỏng vấn.",
            )

        is_authorized = (job.employer_id == current_user.id or job.company_id == context.company.id)
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập dữ liệu phỏng vấn của tin tuyển dụng này.",
            )

        # IDOR prevention: Verify candidate has actually applied to this job or this company
        if payload.resume_id or payload.cv_document_id:
            app_filter = [Application.job_id == job.id]
            if payload.resume_id:
                app_filter.append(Application.resume_id == payload.resume_id)
            if payload.cv_document_id:
                app_filter.append(Application.cv_document_id == payload.cv_document_id)

            app_exists = db.query(Application).filter(*app_filter).first()
            if not app_exists:
                # Also check company-wide applications
                company_app_query = (
                    db.query(Application)
                    .join(Job, Application.job_id == Job.id)
                    .filter(Job.company_id == context.company.id)
                )
                if payload.resume_id:
                    company_app_query = company_app_query.filter(Application.resume_id == payload.resume_id)
                if payload.cv_document_id:
                    company_app_query = company_app_query.filter(Application.cv_document_id == payload.cv_document_id)

                if not company_app_query.first():
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Ứng viên này chưa từng ứng tuyển vào công ty của bạn.",
                    )

    elif current_user.role == UserRole.CANDIDATE:
        # Candidate can only generate interview prep for their own CV
        if payload.cv_document_id:
            cv = db.query(CvDocument).filter(CvDocument.id == payload.cv_document_id).first()
            if not cv or cv.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập hồ sơ này.")
        if payload.resume_id:
            res = db.query(Resume).filter(Resume.id == payload.resume_id).first()
            if not res or res.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập hồ sơ này.")

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
    # 1. Candidate check: must own the document
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

    # 2. Employer check: must have AI permission AND (applied to company OR published in talent search)
    elif current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        if not context.has(CompanyPermission.AI_RECRUITMENT):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền sử dụng tính năng AI CV Copilot.",
            )

        is_authorized = False
        if payload.cv_document_id:
            cv = db.query(CvDocument).filter(CvDocument.id == payload.cv_document_id).first()
            if not cv:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy CV Builder.")
            # Allowed if published in Talent Pool
            if cv.status == CvDocumentStatus.PUBLISHED.value:
                is_authorized = True
            else:
                # Check if applied to employer's company
                has_applied = (
                    db.query(Application)
                    .join(Job, Application.job_id == Job.id)
                    .filter(
                        Job.company_id == context.company.id,
                        Application.cv_document_id == payload.cv_document_id,
                    )
                    .first()
                )
                if has_applied:
                    is_authorized = True

        elif payload.resume_id:
            res = db.query(Resume).filter(Resume.id == payload.resume_id).first()
            if not res:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy Resume.")
            has_applied = (
                db.query(Application)
                .join(Job, Application.job_id == Job.id)
                .filter(
                    Job.company_id == context.company.id,
                    Application.resume_id == payload.resume_id,
                )
                .first()
            )
            if has_applied:
                is_authorized = True

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy vấn hồ sơ này vì ứng viên chưa nộp đơn hoặc chưa công khai hồ sơ.",
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
    # Authorization check for manual re-indexing
    if current_user.role == UserRole.CANDIDATE:
        if document_type == "resume":
            res = db.query(Resume).filter(Resume.id == document_id).first()
            if not res or res.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập tài liệu này.")
        elif document_type == "cv_document":
            cv = db.query(CvDocument).filter(CvDocument.id == document_id).first()
            if not cv or cv.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập tài liệu này.")
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ứng viên không được phép index việc làm.")

    elif current_user.role == UserRole.EMPLOYER:
        context = build_company_context(db, current_user)
        if document_type == "job":
            job = db.query(Job).filter(Job.id == document_id).first()
            if not job or (job.employer_id != current_user.id and job.company_id != context.company.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền index tin tuyển dụng này.")
        elif document_type in ["resume", "cv_document"]:
            app_query = db.query(Application).join(Job, Application.job_id == Job.id).filter(Job.company_id == context.company.id)
            if document_type == "resume":
                app_query = app_query.filter(Application.resume_id == document_id)
            else:
                app_query = app_query.filter(Application.cv_document_id == document_id)
            if not app_query.first():
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền index tài liệu ứng viên này.")

    count = rag_service.index_document(db, document_type=document_type, document_id=document_id)
    return {
        "status": "success",
        "document_type": document_type,
        "document_id": document_id,
        "chunks_indexed": count,
    }


@router.post(
    "/ingest-all",
    summary="Batch Ingest All Documents (Admin only)",
    description="Tự động duyệt và phân đoạn toàn bộ Jobs, Resumes, và CV Documents hiện có trong CSDL.",
)
def batch_ingest_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Quản trị viên (Admin) mới có quyền kích hoạt batch ingest.",
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
