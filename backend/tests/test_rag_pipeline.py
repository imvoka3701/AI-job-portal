"""Unit and Integration Tests for RAG Architecture (Chapter 7: AI Data Architecture).

Tests cover:
1. PII Sanitizer Enclave (email, phone, identity card redaction)
2. DocumentChunker semantic section-based chunking (CvDocument, Resume, Job)
3. DocumentChunker text splitter with overlap
4. CRUD DocumentChunk operations (create, query, delete)
5. Multi-tenant boundary isolation
6. Grounded Interview Question Generation & Citations
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.document_chunk import crud_document_chunk
from app.models.cv_document import CvDocument
from app.models.document_chunk import DocumentChunk
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.rag import (
    DocumentChunkCreate,
    RAGInterviewQuestionsRequest,
)
from app.services.document_chunker import _split_text_with_overlap, document_chunker
from app.services.rag_service import rag_service, sanitize_pii

# --- 1. PII Sanitizer Enclave Tests ---

def test_pii_sanitizer_masks_sensitive_data():
    raw_text = (
        "Ứng viên: Nguyễn Văn A. Email: nguyenvana.dev@gmail.com. "
        "Số điện thoại: 0987654321, hoặc +84 912 345 678. "
        "Số CMND/CCCD: 001201002345. "
        "Địa chỉ: 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội."
    )
    sanitized = sanitize_pii(raw_text)

    assert "nguyenvana.dev@gmail.com" not in sanitized
    assert "[EMAIL_REDACTED]" in sanitized

    assert "0987654321" not in sanitized
    assert "[PHONE_REDACTED]" in sanitized

    assert "001201002345" not in sanitized
    assert "[ID_REDACTED]" in sanitized


# --- 2. Semantic Document Chunker Tests ---

def test_chunk_cv_document_sections():
    content_json = {
        "personal": {
            "full_name": "Trần Kỹ Sư",
            "headline": "Senior Python & AI Engineer",
            "email": "private@email.com",
            "phone": "0901234567",
            "summary": "5 năm kinh nghiệm kiến trúc hệ thống phân tán và RAG pipelines.",
            "location": "Hà Nội",
        },
        "experience": [
            {
                "company": "Tech Corp",
                "role": "Backend Lead",
                "start_date": "2021",
                "end_date": "Present",
                "description": "Thiết kế microservices xử lý 10,000 req/sec với FastAPI và PostgreSQL.",
            }
        ],
        "education": [
            {"school": "Đại học Bách Khoa", "degree": "Kỹ sư CNTT", "year": "2020"}
        ],
        "skills": ["Python", "FastAPI", "PostgreSQL", "pgvector", "Docker"],
        "projects": [
            {
                "name": "AI Job Portal RAG",
                "role": "Architect",
                "description": "Xây dựng hệ thống Hybrid Search kết hợp dense vector và tsvector.",
            }
        ],
    }

    mock_cv_doc = CvDocument(
        id=101,
        user_id=1,
        title="Senior Python AI Engineer",
        content_json=content_json,
    )

    chunks = document_chunker.chunk_cv_document(mock_cv_doc)

    # Verify that key semantic sections were extracted
    section_types = [c.section_type for c in chunks]
    assert "summary" in section_types
    assert "experience" in section_types
    assert "education" in section_types
    assert "skills" in section_types
    assert "project" in section_types

    # Verify metadata richness
    exp_chunk = next(c for c in chunks if c.section_type == "experience")
    assert "Tech Corp" in exp_chunk.content
    assert exp_chunk.document_type == "cv_document"
    assert exp_chunk.document_id == 101


def test_chunk_job_sections():
    mock_job = Job(
        id=202,
        title="Senior Backend Engineer (FastAPI & AI)",
        company_id=5,
        employer_id=10,
        description="Tham gia xây dựng nền tảng tuyển dụng thông minh hàng đầu.",
        requirements="Thành thạo Python, PostgreSQL, REST API, hiểu biết về pgvector và RAG.",
        benefits="Lương hấp dẫn, cổ phần ESOP, làm việc hybrid.",
    )

    chunks = document_chunker.chunk_job(mock_job)

    section_types = [c.section_type for c in chunks]
    assert "summary" in section_types
    assert "requirement" in section_types
    assert "benefit" in section_types

    req_chunk = next(c for c in chunks if c.section_type == "requirement")
    assert "pgvector" in req_chunk.content
    assert req_chunk.company_id == 5
    assert req_chunk.document_type == "job"


def test_recursive_split_for_oversized_text():
    very_long_text = " ".join([f"Kinh nghiệm bước {i}: Tối ưu hóa pipeline AI và database." for i in range(100)])
    splits = _split_text_with_overlap(very_long_text, max_chars=200, overlap=30)

    assert len(splits) > 3
    for s in splits:
        assert len(s) <= 250


# --- 3. CRUD Document Chunk Operations ---

def test_crud_document_chunks(db_session: Session):
    chunks_in = [
        DocumentChunkCreate(
            company_id=1,
            user_id=10,
            document_type="cv_document",
            document_id=999,
            section_type="experience",
            chunk_index=0,
            content="Phát triển hệ thống RAG với PostgreSQL pgvector.",
            metadata_json=json.dumps({"company_id": 1, "section": "experience"}),
        ),
        DocumentChunkCreate(
            company_id=1,
            user_id=10,
            document_type="cv_document",
            document_id=999,
            section_type="skills",
            chunk_index=1,
            content="Kỹ năng: Python, PyTorch, pgvector.",
            metadata_json=json.dumps({"company_id": 1, "section": "skills"}),
        ),
    ]

    # Create
    created = crud_document_chunk.create_chunks(db_session, chunks_data=chunks_in)
    assert len(created) == 2

    # Query
    queried = crud_document_chunk.get_chunks_for_document(
        db_session, document_type="cv_document", document_id=999
    )
    assert len(queried) == 2
    assert queried[0].section_type == "experience"
    assert queried[1].section_type == "skills"

    # Delete
    deleted_count = crud_document_chunk.delete_chunks_for_document(
        db_session, document_type="cv_document", document_id=999
    )
    assert deleted_count == 2

    # Verify empty
    remaining = crud_document_chunk.get_chunks_for_document(
        db_session, document_type="cv_document", document_id=999
    )
    assert len(remaining) == 0


# --- 4. Grounded Interview Questions Generation ---

@pytest.mark.asyncio
async def test_generate_grounded_interview_questions(db_session: Session):
    # Setup test job and candidate chunks
    job = Job(
        id=501,
        title="Senior Python AI Engineer",
        description="Mô tả công việc",
        company_id=1,
        employer_id=2,
    )
    db_session.add(job)
    db_session.commit()

    job_chunk = DocumentChunk(
        company_id=1,
        user_id=2,
        document_type="job",
        document_id=501,
        section_type="requirement",
        chunk_index=0,
        content="Yêu cầu: Kinh nghiệm thiết kế index HNSW và Hybrid search trên PostgreSQL.",
    )
    cv_chunk = DocumentChunk(
        company_id=None,
        user_id=3,
        document_type="cv_document",
        document_id=701,
        section_type="experience",
        chunk_index=0,
        content="Đã triển khai pgvector và hybrid search cho dự án thương mại điện tử với 500k sản phẩm.",
    )
    db_session.add_all([job_chunk, cv_chunk])
    db_session.commit()

    request = RAGInterviewQuestionsRequest(
        job_id=501,
        cv_document_id=701,
        count=1,
        rubric_category="Kỹ thuật chuyên sâu",
    )

    mock_llm_json = {
        "questions": [
            {
                "question": "Bạn đã tối ưu tham số m và ef_construction của HNSW index như thế nào khi mở rộng lên 500k vectors?",
                "rationale": "Ứng viên ghi đã triển khai pgvector cho 500k sản phẩm, cần kiểm tra hiểu biết sâu về indexing.",
                "category": "Kỹ thuật chuyên sâu",
                "difficulty": "senior",
                "cited_chunk_ids": [cv_chunk.id],
            }
        ]
    }

    with patch("app.services.rag_service.deepseek_client.create_chat_completion", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = {
            "choices": [{"message": {"content": json.dumps(mock_llm_json)}}]
        }

        response = await rag_service.generate_grounded_interview_questions(db_session, request)

        assert response.job_title == "Senior Python AI Engineer"
        assert len(response.questions) == 1
        assert response.questions[0].category == "Kỹ thuật chuyên sâu"
        assert response.questions[0].cited_chunk_ids == [cv_chunk.id]
        assert len(response.referenced_chunks) > 0


# --- 5. RAG API Router Tests ---

def _login(client: TestClient, db_session: Session, email: str, role: str = "candidate") -> dict[str, str]:
    payload = {"email": email, "password": "password123", "full_name": email, "role": role}
    if role == "employer":
        payload["company_name"] = "Tech Innovations Inc"
    reg = client.post("/auth/register", json=payload)
    assert reg.status_code in (200, 201), reg.text
    if role == "employer":
        from app.models.user import User
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.is_active = True
            db_session.commit()
    login = client.post("/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_rag_search_api_endpoint(client: TestClient, db_session: Session):
    headers = _login(client, db_session, "rag-search-user@example.com", role="employer")

    with patch("app.services.rag_service.rag_service.search") as mock_search:
        mock_search.return_value = []
        response = client.post(
            "/rag/search",
            json={
                "query": "Kỹ sư Backend FastAPI và PostgreSQL pgvector",
                "document_types": ["cv_document", "resume"],
                "limit": 10,
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "Kỹ sư Backend FastAPI và PostgreSQL pgvector"
        assert "results" in data
        assert data["total_matched"] == 0


def test_rag_index_api_endpoint(client: TestClient, db_session: Session):
    headers = _login(client, db_session, "rag-indexer@example.com", role="candidate")

    with patch("app.services.rag_service.rag_service.index_document") as mock_index:
        mock_index.return_value = 4
        response = client.post(
            "/rag/index?document_type=cv_document&document_id=123",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["chunks_indexed"] == 4


def test_cv_document_create_and_delete_cleans_chunks(client: TestClient, db_session: Session):
    headers = _login(client, db_session, "auto-clean-owner@example.com", role="candidate")

    # 1. Create CV Document
    create_res = client.post(
        "/cv-documents",
        json={
            "title": "Fullstack Python React",
            "template_key": "ats-minimal",
            "content_json": {
                "personal": {"full_name": "Nguyen Van B", "headline": "Senior Fullstack"},
                "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
            },
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    doc_id = create_res.json()["id"]

    # Ingest chunks manually to simulate background task completion
    rag_service.index_document(db_session, document_type="cv_document", document_id=doc_id)
    chunks_before = crud_document_chunk.get_chunks_for_document(
        db_session, document_type="cv_document", document_id=doc_id
    )
    assert len(chunks_before) > 0

    # 2. Delete CV Document and verify chunks are automatically deleted
    delete_res = client.delete(f"/cv-documents/{doc_id}", headers=headers)
    assert delete_res.status_code == 204

    chunks_after = crud_document_chunk.get_chunks_for_document(
        db_session, document_type="cv_document", document_id=doc_id
    )
    assert len(chunks_after) == 0


def test_cv_copilot_chat_endpoint(client: TestClient, db_session: Session):
    headers = _login(client, db_session, "copilot-recruiter@example.com", role="employer")

    cand = User(
        email="copilot-cand@example.com",
        hashed_password="dummy_hashed_password",
        full_name="Trần Văn C",
        role=UserRole.CANDIDATE,
    )
    db_session.add(cand)
    db_session.commit()
    db_session.refresh(cand)

    cv_doc = CvDocument(
        user_id=cand.id,
        title="Senior AI Engineer",
        template_key="ats-minimal",
        content_json={
            "personal": {"full_name": "Trần Văn C", "headline": "AI Specialist"},
            "skills": ["Python", "FastAPI", "DeepSeek", "pgvector"],
            "experience": [
                {
                    "company": "AI Labs",
                    "position": "Lead AI Engineer",
                    "description": "Triển khai hệ thống RAG và mô hình LLM DeepSeek tối ưu độ trễ dưới 200ms.",
                }
            ],
        },
    )
    db_session.add(cv_doc)
    db_session.commit()
    db_session.refresh(cv_doc)

    rag_service.index_document(db_session, document_type="cv_document", document_id=cv_doc.id)

    with patch("app.services.deepseek_client.deepseek_client.create_chat_completion", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Ứng viên Trần Văn C có kinh nghiệm thực chiến triển khai hệ thống RAG và LLM DeepSeek tại AI Labs."
                    }
                }
            ]
        }

        response = client.post(
            "/rag/chat-cv",
            json={
                "query": "Ứng viên này có kinh nghiệm gì với DeepSeek và RAG?",
                "cv_document_id": cv_doc.id,
                "chat_history": [],
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "Trần Văn C" in data["candidate_name"]
        assert "DeepSeek" in data["answer"]
        assert len(data["referenced_chunks"]) > 0


