"""RAG Service — Orchestrates Semantic Indexing, Multi-tenant Hybrid Retrieval, PII Masking, and Grounded Generation."""

import json
import logging
import re

from sqlalchemy.orm import Session

from app.config import settings
from app.crud.cv_document import crud_cv_document
from app.crud.document_chunk import crud_document_chunk
from app.crud.job import crud_job
from app.crud.resume import crud_resume
from app.models.ai_call_log import AIFeature
from app.schemas.rag import (
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
            chunks_data = document_chunker.chunk_cv_document(cv_doc)

        elif document_type == "resume":
            resume = crud_resume.get_by_id(db, resume_id=document_id)
            if not resume:
                logger.warning("resume #%s not found for RAG indexing", document_id)
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
    ) -> list[RAGSearchResult]:
        """Hybrid Search with dense vector similarity, sparse full-text matching, and tenant fence."""
        query_vector = None
        try:
            query_vector = generate_embedding(request.query)
        except Exception as exc:
            logger.warning("Embedding generation failed for query, using fallback: %s", exc)

        return crud_document_chunk.hybrid_search(
            db,
            query_text=request.query,
            query_vector=query_vector,
            document_type=request.document_type,
            company_id=request.company_id,
            section_types=request.section_types,
            limit=request.limit,
            min_score=request.min_score,
        )

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


rag_service = RAGService()
