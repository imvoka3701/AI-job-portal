"""RAG Service — Orchestrates Semantic Indexing, Multi-tenant Hybrid Retrieval, PII Masking, and Grounded Generation."""

import json
import logging
import math
import re
import time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.cv_document import crud_cv_document
from app.crud.document_chunk import crud_document_chunk
from app.crud.job import crud_job
from app.crud.resume import crud_resume
from app.models.ai_call_log import AIFeature
from app.models.cv_document import CvDocument
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.rag import (
    CandidateCompareRequest,
    CandidateCompareResponse,
    CandidateCompareTarget,
    CandidateContrastProfile,
    RAGCVChatRequest,
    RAGCVChatResponse,
    RAGInterviewQuestionItem,
    RAGInterviewQuestionsRequest,
    RAGInterviewQuestionsResponse,
    RAGQueryRequest,
    RAGSearchResult,
)
from app.services.deepseek_client import deepseek_client
from app.services.document_chunker import document_chunker
from app.services.embedding_service import generate_embedding

logger = logging.getLogger(__name__)


def sanitize_pii(text_content: str) -> str:
    """Tier 3 Private Enclave — Redact sensitive personally identifiable information (PII).

    Replaces phone numbers, email addresses, and identification numbers before forwarding to cloud LLM.
    """
    if not text_content:
        return ""

    # Redact email addresses
    sanitized = re.sub(
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        "[EMAIL_REDACTED]",
        text_content,
    )
    # Redact Vietnamese phone numbers (e.g. 0912345678, +84912345678, 0912 345 678)
    sanitized = re.sub(
        r"(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}",
        "[PHONE_REDACTED]",
        sanitized,
    )
    # Redact CCCD/CMND numbers (9 or 12 digits)
    sanitized = re.sub(r"\b[0-9]{9}\b|\b[0-9]{12}\b", "[ID_REDACTED]", sanitized)

    return sanitized


class RAGService:
    """Core RAG orchestrator integrating Ingestion, Storage, Retrieval, and Generation."""

    def index_document(
        self,
        db: Session,
        *,
        document_type: str,
        document_id: int,
    ) -> int:
        """Process, chunk, embed, and store document chunks in PostgreSQL Vector DB."""
        chunks_data = []

        if document_type == "cv_document":
            cv_doc = crud_cv_document.get_by_id(db, document_id=document_id)
            if not cv_doc:
                logger.warning("cv_document #%s not found for RAG indexing", document_id)
                return 0
            is_valid, reason = document_chunker.validate_cv_document_for_rag(cv_doc)
            if not is_valid:
                logger.warning("cv_document #%s rejected from RAG indexing: %s", document_id, reason)
                crud_document_chunk.delete_chunks_for_document(
                    db, document_type="cv_document", document_id=document_id
                )
                return 0
            chunks_data = document_chunker.chunk_cv_document(cv_doc)

        elif document_type == "resume":
            resume = crud_resume.get_by_id(db, resume_id=document_id)
            if not resume:
                logger.warning("resume #%s not found for RAG indexing", document_id)
                return 0
            if not resume.is_validated:
                logger.warning("resume #%s is not validated as standard CV, skipping RAG indexing", document_id)
                crud_document_chunk.delete_chunks_for_document(
                    db, document_type="resume", document_id=document_id
                )
                return 0
            chunks_data = document_chunker.chunk_resume(resume)

        elif document_type == "job":
            job = crud_job.get_by_id(db, job_id=document_id)
            if not job:
                logger.warning("job #%s not found for RAG indexing", document_id)
                return 0
            chunks_data = document_chunker.chunk_job(job)

        else:
            raise ValueError(f"Unsupported document_type: {document_type}")

        if not chunks_data:
            crud_document_chunk.delete_chunks_for_document(
                db, document_type=document_type, document_id=document_id
            )
            return 0

        # Generate dense embeddings for each chunk
        embeddings = []
        for chunk in chunks_data:
            try:
                emb = generate_embedding(chunk.content)
                embeddings.append(emb)
            except Exception as exc:
                logger.warning("Failed to generate embedding for chunk: %s", exc)
                embeddings.append(None)

        # Atomic refresh: remove old chunks and insert new
        crud_document_chunk.delete_chunks_for_document(
            db, document_type=document_type, document_id=document_id
        )
        saved = crud_document_chunk.create_chunks(
            db, chunks_data=chunks_data, embeddings=embeddings
        )
        logger.info(
            "RAG indexed %s chunks for %s #%s",
            len(saved),
            document_type,
            document_id,
        )
        return len(saved)

    def search(
        self,
        db: Session,
        request: RAGQueryRequest,
        actor_user_id: int | None = None,
        actor_email: str | None = None,
        company_name: str | None = None,
    ) -> list[RAGSearchResult]:
        """Hybrid Search with dense vector similarity, sparse full-text matching, and tenant fence."""
        from app.services.rag_governance_service import rag_governance_service

        if not rag_governance_service.is_enabled():
            cfg = rag_governance_service.get_config()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=cfg.maintenance_message,
            )

        start_time = time.perf_counter()
        cfg = rag_governance_service.get_config()

        query_vector = None
        try:
            query_vector = generate_embedding(request.query)
        except Exception as exc:
            logger.warning("Embedding generation failed for query, using fallback: %s", exc)

        results = crud_document_chunk.hybrid_search(
            db,
            query_text=request.query,
            query_vector=query_vector,
            document_type=request.document_type,
            document_types=request.document_types,
            company_id=request.company_id,
            user_id=request.user_id,
            job_id=request.job_id,
            only_company_applicants=request.only_company_applicants,
            section_types=request.section_types,
            limit=request.limit,
            min_score=request.min_score,
            exclude_drafts=request.exclude_drafts,
            alpha_dense=cfg.hybrid_alpha_dense,
            alpha_sparse=cfg.hybrid_alpha_sparse,
        )

        if not results:
            return results

        # Batch enrich candidate names and document titles
        user_ids = {r.user_id for r in results if r.user_id}
        cv_doc_ids = {r.document_id for r in results if r.document_type == "cv_document"}
        resume_ids = {r.document_id for r in results if r.document_type == "resume"}
        job_ids = {r.document_id for r in results if r.document_type == "job"}

        users_map = {}
        if user_ids:
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            users_map = {u.id: (u.full_name or u.email, u.email) for u in users}

        cv_titles_map = {}
        if cv_doc_ids:
            docs = db.query(CvDocument).filter(CvDocument.id.in_(cv_doc_ids)).all()
            cv_titles_map = {d.id: d.title for d in docs}

        resume_titles_map = {}
        if resume_ids:
            resumes = db.query(Resume).filter(Resume.id.in_(resume_ids)).all()
            resume_titles_map = {
                r.id: (getattr(r, "title", None) or getattr(r, "file_name", None) or f"CV đính kèm #{r.id}")
                for r in resumes
            }

        job_titles_map = {}
        if job_ids:
            jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
            job_titles_map = {j.id: j.title for j in jobs}

        # Batch enrich application info if company_id is provided
        apps_map = {}
        user_app_map = {}
        if request.company_id and (resume_ids or cv_doc_ids or user_ids):
            from app.models.application import Application

            app_query = (
                db.query(Application, Job.title.label("job_title"))
                .join(Job, Job.id == Application.job_id)
                .filter(Job.company_id == request.company_id)
            )
            if request.job_id:
                app_query = app_query.filter(Job.id == request.job_id)

            app_rows = app_query.order_by(Application.applied_at.desc()).all()
            for app, job_title in app_rows:
                if app.resume_id:
                    apps_map[("resume", app.resume_id)] = (app, job_title)
                if app.cv_document_id:
                    apps_map[("cv_document", app.cv_document_id)] = (app, job_title)
                if app.candidate_id not in user_app_map:
                    user_app_map[app.candidate_id] = (app, job_title)

        for r in results:
            if r.user_id and r.user_id in users_map:
                name, email = users_map[r.user_id]
                r.candidate_name = name
                r.candidate_email = email
            if r.document_type == "cv_document":
                r.document_title = cv_titles_map.get(r.document_id)
            elif r.document_type == "resume":
                r.document_title = resume_titles_map.get(r.document_id)
            elif r.document_type == "job":
                r.document_title = job_titles_map.get(r.document_id)

            # Enrich application data
            matched_app_info = apps_map.get((r.document_type, r.document_id))
            if not matched_app_info and r.user_id:
                matched_app_info = user_app_map.get(r.user_id)

            if matched_app_info:
                app, job_title = matched_app_info
                r.applied_job_id = app.job_id
                r.applied_job_title = job_title
                r.application_status = (
                    app.status.value if hasattr(app.status, "value") else str(app.status)
                )
                r.application_id = app.id
        # Record search telemetry for Admin RAG Governance
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        max_score = max((r.hybrid_score for r in results), default=0.0)
        rag_governance_service.record_search(
            query=request.query,
            results_count=len(results),
            duration_ms=duration_ms,
            min_score=request.min_score,
            company_id=request.company_id,
            company_name=company_name,
            user_id=actor_user_id if actor_user_id is not None else request.user_id,
            user_email=actor_email,
            job_id=request.job_id,
            section_types=request.section_types,
            max_hybrid_score=max_score,
            status="success" if results else "empty",
        )

        return results

    async def generate_grounded_interview_questions(
        self,
        db: Session,
        request: RAGInterviewQuestionsRequest,
    ) -> RAGInterviewQuestionsResponse:
        """Grounded Generation — Synthesizes interview questions referencing exact candidate & job chunks."""
        job = crud_job.get_by_id(db, job_id=request.job_id)
        if not job:
            raise ValueError(f"Job #{request.job_id} không tồn tại")

        # 1. Fetch Job requirement chunks
        job_chunks = crud_document_chunk.get_chunks_for_document(
            db, document_type="job", document_id=request.job_id
        )
        # If job has not been indexed yet, auto-index it
        if not job_chunks:
            self.index_document(db, document_type="job", document_id=request.job_id)
            job_chunks = crud_document_chunk.get_chunks_for_document(
                db, document_type="job", document_id=request.job_id
            )

        # 2. Fetch Candidate chunks
        candidate_chunks = []
        candidate_name = None
        if request.cv_document_id:
            candidate_chunks = crud_document_chunk.get_chunks_for_document(
                db, document_type="cv_document", document_id=request.cv_document_id
            )
            if not candidate_chunks:
                self.index_document(db, document_type="cv_document", document_id=request.cv_document_id)
                candidate_chunks = crud_document_chunk.get_chunks_for_document(
                    db, document_type="cv_document", document_id=request.cv_document_id
                )
            cv_doc = crud_cv_document.get_by_id(db, document_id=request.cv_document_id)
            if cv_doc and cv_doc.user:
                candidate_name = cv_doc.user.full_name or cv_doc.user.email

        elif request.resume_id:
            candidate_chunks = crud_document_chunk.get_chunks_for_document(
                db, document_type="resume", document_id=request.resume_id
            )
            if not candidate_chunks:
                self.index_document(db, document_type="resume", document_id=request.resume_id)
                candidate_chunks = crud_document_chunk.get_chunks_for_document(
                    db, document_type="resume", document_id=request.resume_id
                )
            resume = crud_resume.get_by_id(db, resume_id=request.resume_id)
            if resume and resume.user:
                candidate_name = resume.user.full_name or resume.user.email

        # 3. Assemble Grounded Context with PII Masking
        context_blocks = []
        referenced_results: list[RAGSearchResult] = []

        context_blocks.append("=== THÔNG TIN YÊU CẦU CÔNG VIỆC (JOB DESCRIPTION) ===")
        for c in job_chunks[:5]:
            safe_text = sanitize_pii(c.content)
            context_blocks.append(f"[JD_Chunk #{c.id} - {c.section_type}]:\n{safe_text}")
            referenced_results.append(
                RAGSearchResult(
                    chunk_id=c.id,
                    document_type=c.document_type,
                    document_id=c.document_id,
                    company_id=c.company_id,
                    section_type=c.section_type,
                    chunk_index=c.chunk_index,
                    content=safe_text,
                    metadata=c.metadata_dict,
                    dense_score=1.0,
                    sparse_score=1.0,
                    hybrid_score=1.0,
                )
            )

        context_blocks.append("\n=== KINH NGHIỆM THỰC TẾ CỦA ỨNG VIÊN (CANDIDATE PROFILE) ===")
        for c in candidate_chunks[:7]:
            safe_text = sanitize_pii(c.content)
            context_blocks.append(f"[Candidate_Chunk #{c.id} - {c.section_type}]:\n{safe_text}")
            referenced_results.append(
                RAGSearchResult(
                    chunk_id=c.id,
                    document_type=c.document_type,
                    document_id=c.document_id,
                    company_id=c.company_id,
                    section_type=c.section_type,
                    chunk_index=c.chunk_index,
                    content=safe_text,
                    metadata=c.metadata_dict,
                    dense_score=1.0,
                    sparse_score=1.0,
                    hybrid_score=1.0,
                )
            )

        grounded_context = "\n\n".join(context_blocks)

        # 4. Invoke LLM with strict grounded prompting
        system_prompt = (
            "Bạn là Giám đốc Kỹ thuật (Technical Lead) và Trưởng Hội đồng Tuyển dụng cao cấp. "
            "Nhiệm vụ của bạn là sinh ra các câu hỏi phỏng vấn chuyên sâu bám sát thực tế dựa trên các đoạn văn bản (chunks) được cung cấp. "
            "\nNGUYÊN TẮC BẮT BUỘC:\n"
            "1. Tuyệt đối KHÔNG hỏi các câu hỏi lý thuyết chung chung (như 'Em hãy giới thiệu bản thân' hay 'OOP là gì').\n"
            "2. Mỗi câu hỏi phải gắn liền với một dự án hoặc kinh nghiệm cụ thể trong [Candidate_Chunk] và đối chiếu với yêu cầu trong [JD_Chunk].\n"
            "3. Bắt buộc cung cấp danh sách ID của các chunks được tham chiếu trong trường 'cited_chunk_ids'.\n"
            "4. Phản hồi bằng JSON đúng định dạng."
        )

        rubric_filter = f" Tập trung vào tiêu chí Rubric: {request.rubric_category}." if request.rubric_category else ""
        user_prompt = (
            f"Hãy tạo {request.count} câu hỏi phỏng vấn chuyên sâu cho vị trí '{job.title}'.{rubric_filter}\n\n"
            f"DỮ LIỆU CHỨNG CỨ:\n{grounded_context}\n\n"
            "Định dạng JSON yêu cầu:\n"
            "{\n"
            '  "questions": [\n'
            "    {\n"
            '      "question": "Câu hỏi chi tiết xoáy sâu vào tình huống thực tế",\n'
            '      "rationale": "Lý do hỏi câu này dựa trên đối chiếu giữa JD và CV",\n'
            '      "category": "Kỹ thuật / Thiết kế hệ thống / Xử lý sự cố",\n'
            '      "difficulty": "intermediate",\n'
            '      "cited_chunk_ids": [12, 45]\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        try:
            llm_response = await deepseek_client.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=settings.LLM_MODEL,
                response_format={"type": "json_object"},
                feature=AIFeature.INTERVIEW_PREP if hasattr(AIFeature, "INTERVIEW_PREP") else AIFeature.CV_EVALUATE,
                db=db,
            )

            raw_content = llm_response.get("choices", [])[0].get("message", {}).get("content", "{}")
            parsed_json = json.loads(raw_content)
            q_list = parsed_json.get("questions", [])

            questions_out = [
                RAGInterviewQuestionItem(
                    question=item.get("question", ""),
                    rationale=item.get("rationale", ""),
                    category=item.get("category", "Kỹ thuật chuyên sâu"),
                    difficulty=item.get("difficulty", "intermediate"),
                    cited_chunk_ids=item.get("cited_chunk_ids", []),
                )
                for item in q_list
            ]

            return RAGInterviewQuestionsResponse(
                job_title=job.title,
                candidate_name=candidate_name,
                questions=questions_out,
                referenced_chunks=referenced_results,
            )

        except Exception as exc:
            logger.exception("Failed in Grounded Interview Questions Generation: %s", exc)
            # Fallback heuristic questions if LLM call fails
            return RAGInterviewQuestionsResponse(
                job_title=job.title,
                candidate_name=candidate_name,
                questions=[
                    RAGInterviewQuestionItem(
                        question=f"Dựa trên yêu cầu của vị trí {job.title}, bạn hãy chia sẻ kinh nghiệm xử lý thách thức kỹ thuật phức tạp nhất trong các dự án gần đây?",
                        rationale="Đánh giá năng lực giải quyết vấn đề thực chiến",
                        category="Kinh nghiệm thực chiến",
                        difficulty="intermediate",
                        cited_chunk_ids=[c.id for c in candidate_chunks[:2]],
                    )
                ],
                referenced_chunks=referenced_results,
            )

    async def chat_with_cv(
        self,
        db: Session,
        request: RAGCVChatRequest,
    ) -> RAGCVChatResponse:
        """Grounded CV Copilot — Answers queries regarding candidate profile with exact chunk citations."""
        if not request.cv_document_id and not request.resume_id:
            raise ValueError("Bắt buộc phải cung cấp cv_document_id hoặc resume_id.")

        candidate_chunks = []
        candidate_name = None
        document_title = None

        if request.cv_document_id:
            candidate_chunks = crud_document_chunk.get_chunks_for_document(
                db, document_type="cv_document", document_id=request.cv_document_id
            )
            if not candidate_chunks:
                self.index_document(db, document_type="cv_document", document_id=request.cv_document_id)
                candidate_chunks = crud_document_chunk.get_chunks_for_document(
                    db, document_type="cv_document", document_id=request.cv_document_id
                )
            cv_doc = crud_cv_document.get_by_id(db, document_id=request.cv_document_id)
            if cv_doc:
                document_title = cv_doc.title
                if cv_doc.user:
                    candidate_name = cv_doc.user.full_name or cv_doc.user.email

        elif request.resume_id:
            candidate_chunks = crud_document_chunk.get_chunks_for_document(
                db, document_type="resume", document_id=request.resume_id
            )
            if not candidate_chunks:
                self.index_document(db, document_type="resume", document_id=request.resume_id)
                candidate_chunks = crud_document_chunk.get_chunks_for_document(
                    db, document_type="resume", document_id=request.resume_id
                )
            resume = crud_resume.get_by_id(db, resume_id=request.resume_id)
            if resume:
                document_title = (
                    getattr(resume, "title", None)
                    or getattr(resume, "file_name", None)
                    or f"CV đính kèm #{resume.id}"
                )
                if resume.user:
                    candidate_name = resume.user.full_name or resume.user.email

        if not candidate_chunks:
            return RAGCVChatResponse(
                answer="Không tìm thấy nội dung phân đoạn nào trong hồ sơ này để phân tích.",
                candidate_name=candidate_name,
                document_title=document_title,
                cited_chunk_ids=[],
                referenced_chunks=[],
            )

        # Retrieve relevant chunks using vector similarity if available
        selected_chunks = candidate_chunks[:8]
        try:
            query_vector = generate_embedding(request.query)
            if query_vector:
                scored_chunks = []
                for c in candidate_chunks:
                    try:
                        emb = c.embedding
                        if emb is not None:
                            emb_list = list(emb)
                            dot = sum(a * b for a, b in zip(query_vector, emb_list))
                            scored_chunks.append((dot, c))
                        else:
                            scored_chunks.append((0.0, c))
                    except Exception:
                        scored_chunks.append((0.0, c))
                scored_chunks.sort(key=lambda x: x[0], reverse=True)
                selected_chunks = [c for _, c in scored_chunks[:7]]
        except Exception as exc:
            logger.warning("Failed to calculate vector similarity for chat query: %s", exc)

        referenced_results: list[RAGSearchResult] = []
        context_blocks = []
        for c in selected_chunks:
            safe_text = sanitize_pii(c.content)
            context_blocks.append(f"[Chunk #{c.id} - Phân đoạn: {c.section_type}]:\n{safe_text}")
            referenced_results.append(
                RAGSearchResult(
                    chunk_id=c.id,
                    document_type=c.document_type,
                    document_id=c.document_id,
                    company_id=c.company_id,
                    user_id=c.user_id,
                    candidate_name=candidate_name,
                    document_title=document_title,
                    section_type=c.section_type,
                    chunk_index=c.chunk_index,
                    content=safe_text,
                    metadata=c.metadata_dict,
                    dense_score=1.0,
                    sparse_score=1.0,
                    hybrid_score=1.0,
                )
            )

        grounded_context = "\n\n".join(context_blocks)

        system_prompt = (
            "Bạn là CV Copilot AI — Trợ lý phân tích hồ sơ ứng viên cao cấp dựa trên RAG. "
            f"Bạn đang hỗ trợ Nhà tuyển dụng hoặc Ứng viên phân tích hồ sơ của: {candidate_name or 'Ứng viên'}. "
            "\nNGUYÊN TẮC BẮT BUỘC:\n"
            "1. Căn cứ trả lời TUYỆT ĐỐI dựa trên các phân đoạn văn bản [Chunk #...] được cung cấp bên dưới.\n"
            "2. Tuyệt đối KHÔNG bịa đặt kinh nghiệm hoặc công nghệ mà ứng viên chưa từng đề cập.\n"
            "3. Khi đề cập đến một thông tin, hãy trích dẫn mã chunk tương ứng trong dấu ngoặc vuông (Ví dụ: [Chunk #12]).\n"
            "4. Nếu trong hồ sơ không có thông tin về câu hỏi của người dùng, hãy trả lời rõ ràng, trung thực rằng hồ sơ không đề cập đến nội dung này."
        )

        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"DƯỚI ĐÂY LÀ CÁC TRÍCH ĐOẠN TỪ HỒ SƠ ỨNG VIÊN:\n\n{grounded_context}\n\nLỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:"
            }
        ]

        for prev in request.chat_history[-6:]:
            messages.append({"role": prev.role, "content": prev.content})

        messages.append({
            "role": "user",
            "content": f"Câu hỏi hiện tại: {request.query}"
        })

        try:
            llm_response = await deepseek_client.create_chat_completion(
                messages=messages,
                model=settings.LLM_MODEL,
                response_format=None,
                feature=AIFeature.COPILOT if hasattr(AIFeature, "COPILOT") else AIFeature.CV_EVALUATE,
                db=db,
            )
            answer = llm_response.get("choices", [])[0].get("message", {}).get("content", "")
        except Exception as exc:
            logger.exception("DeepSeek chat completion failed: %s", exc)
            answer = f"Không thể xử lý phản hồi từ mô hình AI: {str(exc)}"

        cited_ids = set()
        for match in re.finditer(r"\[Chunk #(\d+)\]", answer):
            try:
                cited_ids.add(int(match.group(1)))
            except ValueError:
                pass

        if not cited_ids and referenced_results:
            cited_ids = {r.chunk_id for r in referenced_results[:3]}

        return RAGCVChatResponse(
            answer=answer,
            candidate_name=candidate_name,
            document_title=document_title,
            cited_chunk_ids=sorted(list(cited_ids)),
            referenced_chunks=referenced_results,
        )

    def compare_candidates(
        self,
        db: Session,
        request: CandidateCompareRequest,
    ) -> CandidateCompareResponse:
        """Live AI Candidate Contrast: Dual-candidate side-by-side mathematical & semantic evaluation."""
        from app.services.ai_matching import extract_cv_document_text

        job = crud_job.get_by_id(db, job_id=request.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy tin tuyển dụng #{request.job_id}",
            )

        # 1. Job embedding extraction (or lazily compute & persist)
        if job.embedding is not None:
            job_emb = list(job.embedding)
        else:
            jd_text = f"{job.title} {job.description} {job.requirements or ''}".strip()
            job_emb = generate_embedding(jd_text)
            job.embedding = job_emb
            db.commit()

        # 2. Extract technical required skills from Job
        tech_keywords = [
            "Python", "FastAPI", "Django", "Flask", "React", "TypeScript", "JavaScript",
            "Node.js", "Express", "Next.js", "Vue", "Angular", "Docker", "Kubernetes",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQL", "NoSQL",
            "AWS", "GCP", "Azure", "CI/CD", "Git", "GitHub", "Linux", "REST API", "GraphQL",
            "Microservices", "Java", "Spring", "Golang", "Go", "C#", ".NET", "PHP", "Laravel",
            "HTML", "CSS", "Tailwind", "Bootstrap", "Figma", "UI/UX", "Machine Learning",
            "Deep Learning", "TensorFlow", "PyTorch", "NLP", "LLM", "RAG", "pgvector",
        ]
        job_full_text = f"{job.title} {job.requirements or ''} {job.description or ''}"
        job_required_skills = [
            kw for kw in tech_keywords
            if re.search(r"\b" + re.escape(kw.lower()) + r"\b", job_full_text.lower())
        ]
        if not job_required_skills:
            job_required_skills = [w for w in job.title.split() if len(w) > 3][:5]

        # 3. Candidate evaluation helper
        def _analyze_candidate(target: CandidateCompareTarget) -> CandidateContrastProfile:
            cand_name = "Ứng viên"
            cand_email = None
            cand_text = ""
            cand_skills: list[str] = []
            cand_emb: list[float] = []

            if target.document_type == "resume":
                resume = crud_resume.get_by_id(db, resume_id=target.document_id)
                if not resume:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Không tìm thấy hồ sơ Resume #{target.document_id}",
                    )
                cand_name = (
                    resume.user.full_name if resume.user else None
                ) or resume.title or f"Ứng viên #{resume.id}"
                cand_email = resume.user.email if resume.user else None
                cand_text = resume.raw_text or ""
                if resume.parsed_skills:
                    try:
                        cand_skills = (
                            json.loads(resume.parsed_skills)
                            if isinstance(resume.parsed_skills, str)
                            else list(resume.parsed_skills)
                        )
                    except Exception:
                        cand_skills = []
                else:
                    cand_skills = []
                if resume.embedding is not None:
                    cand_emb = list(resume.embedding)
                elif cand_text.strip():
                    cand_emb = generate_embedding(cand_text)
                    resume.embedding = cand_emb
                    db.commit()

            elif target.document_type == "cv_document":
                cv_doc = crud_cv_document.get_by_id(db, document_id=target.document_id)
                if not cv_doc:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Không tìm thấy hồ sơ CV Builder #{target.document_id}",
                    )
                content = cv_doc.content_json or {}
                personal = content.get("personal", {})
                cand_name = (
                    personal.get("full_name")
                    or cv_doc.title
                    or (cv_doc.user.full_name if cv_doc.user else f"Ứng viên #{cv_doc.id}")
                )
                cand_email = personal.get("email") or (cv_doc.user.email if cv_doc.user else None)
                cand_text = extract_cv_document_text(cv_doc)
                skills_raw = content.get("skills", [])
                for s in skills_raw:
                    if isinstance(s, str) and s.strip():
                        cand_skills.append(s.strip())
                    elif isinstance(s, dict) and s.get("name"):
                        cand_skills.append(str(s["name"]).strip())
                if cand_text.strip():
                    cand_emb = generate_embedding(cand_text)

            if not cand_emb:
                cand_emb = [0.0] * 384

            # Enrich candidate skills from raw text
            for kw in tech_keywords:
                if kw not in cand_skills and re.search(
                    r"\b" + re.escape(kw.lower()) + r"\b", cand_text.lower()
                ):
                    cand_skills.append(kw)

            # Cosine similarity calculation
            norm_a = math.sqrt(sum(x * x for x in cand_emb))
            norm_b = math.sqrt(sum(x * x for x in job_emb))
            if norm_a > 0 and norm_b > 0:
                dot = sum(a * b for a, b in zip(cand_emb, job_emb))
                raw_cosine = dot / (norm_a * norm_b)
                vector_cosine_score = round(max(0.0, min(100.0, raw_cosine * 100)), 1)
            else:
                vector_cosine_score = 0.0

            # Match vs Missing Skills
            matched_skills = [
                s for s in job_required_skills
                if any(s.lower() == c.lower() for c in cand_skills)
                or re.search(r"\b" + re.escape(s.lower()) + r"\b", cand_text.lower())
            ]
            missing_skills = [s for s in job_required_skills if s not in matched_skills]
            skills_score = round(
                (len(matched_skills) / max(len(job_required_skills), 1)) * 100, 1
            )

            # Experience calculation heuristic
            years_found: list[float] = []
            for match in re.finditer(r"(\d+)\s*(?:\+|-\d+)?\s*(?:năm|year)", cand_text.lower()):
                try:
                    val = float(match.group(1))
                    if 1 <= val <= 30:
                        years_found.append(val)
                except ValueError:
                    pass
            est_years = max(years_found) if years_found else 1.0

            job_lvl = getattr(job.experience_level, "value", str(job.experience_level)).lower()
            if "lead" in job_lvl or "senior" in job_lvl:
                target_years = 4.0
            elif "middle" in job_lvl:
                target_years = 2.5
            elif "junior" in job_lvl:
                target_years = 1.0
            else:
                target_years = 0.5

            if est_years >= target_years:
                experience_score = min(100.0, round(85.0 + (est_years - target_years) * 5.0, 1))
            else:
                experience_score = max(30.0, round(85.0 - (target_years - est_years) * 20.0, 1))

            deal_breakers = []
            if len(job_required_skills) >= 2 and len(matched_skills) == 0:
                deal_breakers.append("Không đáp ứng bất kỳ kỹ năng công nghệ cốt lõi nào trong yêu cầu")
            if est_years < target_years - 1.5:
                deal_breakers.append(
                    f"Số năm kinh nghiệm ({est_years:.0f} năm) thấp hơn nhiều so với chuẩn {job_lvl.upper()} ({target_years:.0f}+ năm)"
                )

            weighted = 0.35 * vector_cosine_score + 0.40 * skills_score + 0.25 * experience_score
            if deal_breakers:
                total_match_score = round(min(weighted, 60.0), 1)
            else:
                total_match_score = round(max(0.0, min(100.0, weighted)), 1)

            vector_sample = [round(v, 4) for v in cand_emb[:8]]

            return CandidateContrastProfile(
                document_type=target.document_type,
                document_id=target.document_id,
                candidate_name=cand_name,
                candidate_email=cand_email,
                applied_job_title=job.title,
                total_match_score=total_match_score,
                vector_cosine_score=vector_cosine_score,
                skills_score=skills_score,
                experience_score=experience_score,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                all_skills=cand_skills[:12],
                years_of_experience=est_years,
                deal_breakers=deal_breakers,
                vector_sample=vector_sample,
            )

        p1 = _analyze_candidate(request.candidate_1)
        p2 = _analyze_candidate(request.candidate_2)

        # 4. Generate Comparative Verdict
        breakdown = []
        diff = round(p1.total_match_score - p2.total_match_score, 1)
        if abs(diff) < 5.0:
            verdict_summary = (
                f"Cả hai ứng viên có mức độ tương thích tương đương ({p1.total_match_score}% so với {p2.total_match_score}%). "
                f"Nên đánh giá thêm qua phỏng vấn kỹ thuật chuyên sâu để chọn người phù hợp nhất."
            )
        elif diff >= 5.0:
            verdict_summary = (
                f"{p1.candidate_name} có mức độ phù hợp vượt trội ({p1.total_match_score}% vs {p2.total_match_score}%), "
                f"đáp ứng sát sao hơn về kỹ năng chuyên môn cốt lõi và tương quan ngữ nghĩa vector."
            )
        else:
            verdict_summary = (
                f"{p2.candidate_name} có mức độ phù hợp vượt trội ({p2.total_match_score}% vs {p1.total_match_score}%), "
                f"đáp ứng sát sao hơn về kỹ năng chuyên môn cốt lõi và tương quan ngữ nghĩa vector."
            )

        # Skills breakdown
        if len(p1.matched_skills) > len(p2.matched_skills):
            skills_str = ", ".join(p1.matched_skills[:3])
            breakdown.append(
                f"Kỹ năng: {p1.candidate_name} đáp ứng {len(p1.matched_skills)}/{len(job_required_skills)} kỹ năng ({skills_str}), "
                f"nhiều hơn {p2.candidate_name} ({len(p2.matched_skills)}/{len(job_required_skills)} kỹ năng)."
            )
        elif len(p2.matched_skills) > len(p1.matched_skills):
            skills_str = ", ".join(p2.matched_skills[:3])
            breakdown.append(
                f"Kỹ năng: {p2.candidate_name} đáp ứng {len(p2.matched_skills)}/{len(job_required_skills)} kỹ năng ({skills_str}), "
                f"nhiều hơn {p1.candidate_name} ({len(p1.matched_skills)}/{len(job_required_skills)} kỹ năng)."
            )
        else:
            breakdown.append(f"Kỹ năng: Cả hai ứng viên cùng đáp ứng {len(p1.matched_skills)} kỹ năng cốt lõi.")

        # Vector semantic breakdown
        if p1.vector_cosine_score > p2.vector_cosine_score + 3.0:
            breakdown.append(
                f"Ngữ nghĩa Vector (Cosine): {p1.candidate_name} đạt {p1.vector_cosine_score}%, cao hơn {p2.candidate_name} ({p2.vector_cosine_score}%)."
            )
        elif p2.vector_cosine_score > p1.vector_cosine_score + 3.0:
            breakdown.append(
                f"Ngữ nghĩa Vector (Cosine): {p2.candidate_name} đạt {p2.vector_cosine_score}%, cao hơn {p1.candidate_name} ({p1.vector_cosine_score}%)."
            )

        # Experience breakdown
        breakdown.append(
            f"Kinh nghiệm: {p1.candidate_name} ({p1.years_of_experience:.0f} năm) so với {p2.candidate_name} ({p2.years_of_experience:.0f} năm)."
        )

        # Deal-breakers warning
        if p1.deal_breakers or p2.deal_breakers:
            warn1 = f"[{p1.candidate_name}]: {'; '.join(p1.deal_breakers)}" if p1.deal_breakers else ""
            warn2 = f"[{p2.candidate_name}]: {'; '.join(p2.deal_breakers)}" if p2.deal_breakers else ""
            breakdown.append(f"Cảnh báo rủi ro tiêu chí: {warn1} {warn2}".strip())

        formula_meta = {
            "formula": "0.35 * Vector + 0.40 * Skills + 0.25 * Experience",
            "vector_weight": 0.35,
            "skills_weight": 0.40,
            "experience_weight": 0.25,
            "penalty_cap": 60.0,
            "embedding_dimension": 384,
            "model_name": "paraphrase-multilingual-MiniLM-L12-v2",
        }

        job_level_str = getattr(job.experience_level, "value", str(job.experience_level))

        return CandidateCompareResponse(
            job_id=job.id,
            job_title=job.title,
            job_required_skills=job_required_skills,
            job_level=job_level_str,
            candidate_1=p1,
            candidate_2=p2,
            verdict_summary=verdict_summary,
            verdict_breakdown=breakdown,
            formula_metadata=formula_meta,
        )

    def index_document_background(self, document_type: str, document_id: int) -> int:
        """Safely index a document in a background task using its own isolated database session."""
        from app.database import SessionLocal

        db = SessionLocal()
        try:
            count = self.index_document(db, document_type=document_type, document_id=document_id)
            logger.info(
                "Background RAG indexed %s #%s successfully (%s chunks)",
                document_type,
                document_id,
                count,
            )
            return count
        except Exception as exc:
            logger.warning(
                "Background RAG indexing failed for %s #%s: %s",
                document_type,
                document_id,
                exc,
            )
            return 0
        finally:
            db.close()


rag_service = RAGService()
