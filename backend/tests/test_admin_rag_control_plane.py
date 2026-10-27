"""Tests for Admin RAG Control Plane V2 — Chunking Parametrization, Simulator, Surgery, and Orphans.

Strict Zero-Residue Policy:
All created test users, CV documents, resumes, and document chunks are explicitly deleted in teardown.
"""

import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.cv_document import CvDocument
from app.models.document_chunk import DocumentChunk
from app.models.user import User, UserRole
from app.services.rag_governance_service import rag_governance_service


def _get_admin_headers(client: TestClient, db: Session, email: str = "admin_rag_cp@jobportal.vn") -> tuple[dict[str, str], int]:
    """Create or reset an admin user and return authorization bearer headers along with user id."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("password123"),
            full_name="Admin RAG CP Tester",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    login = client.post("/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user.id


def test_admin_rag_chunking_config_tuning_and_revert(client: TestClient, db_session: Session):
    """Pillar 1: Dynamic Chunking Parameters Tuning & State Persistence."""
    test_email = "admin_rag_chunk_cfg@jobportal.vn"
    headers, admin_id = _get_admin_headers(client, db_session, test_email)

    # Capture initial config to ensure 100% clean state restoration
    initial_cfg = rag_governance_service.get_config()

    try:
        # 1. Update Chunking Parameters via PATCH /admin/rag/config
        update_payload = {
            "chunk_size": 1800,
            "chunk_overlap": 200,
            "min_chunk_length": 50,
            "chunking_strategy": "semantic_sections",
        }
        res_patch = client.patch("/admin/rag/config", json=update_payload, headers=headers)
        assert res_patch.status_code == 200, res_patch.text
        data = res_patch.json()
        assert data["chunk_size"] == 1800
        assert data["chunk_overlap"] == 200
        assert data["min_chunk_length"] == 50
        assert data["chunking_strategy"] == "semantic_sections"

        # 2. Verify GET /admin/rag/config reflects the tuned values
        res_get = client.get("/admin/rag/config", headers=headers)
        assert res_get.status_code == 200
        assert res_get.json()["chunk_size"] == 1800

        # 3. Test parameter boundary validation (chunk_size out of bounds [200, 3000])
        res_invalid = client.patch("/admin/rag/config", json={"chunk_size": 100}, headers=headers)
        assert res_invalid.status_code == 422
    finally:
        # Revert config cleanly
        rag_governance_service.update_config(
            chunk_size=initial_cfg.chunk_size,
            chunk_overlap=initial_cfg.chunk_overlap,
            min_chunk_length=initial_cfg.min_chunk_length,
            chunking_strategy=initial_cfg.chunking_strategy,
            updated_by_email="system@test",
        )
        # Teardown user
        db_session.query(User).filter(User.id == admin_id).delete()
        db_session.commit()


def test_admin_rag_live_chunk_simulation_cv_document(client: TestClient, db_session: Session):
    """Pillar 2: Live Chunking Simulator Sandbox for CV Builder documents (Zero DB Writes)."""
    test_email = "admin_rag_sim_cv@jobportal.vn"
    headers, admin_id = _get_admin_headers(client, db_session, test_email)

    try:
        # Sample rich CV Builder payload
        cv_content = {
            "personal": {
                "full_name": "Nguyễn Văn Chuyên Nghiệp",
                "headline": "Lead AI & Backend Architect",
                "summary": "Kỹ sư trưởng với hơn 8 năm kinh nghiệm kiến trúc hệ thống RAG quy mô lớn trên nền tảng AWS và FastAPI.",
                "location": "Hà Nội, Việt Nam",
            },
            "skills": ["Python", "FastAPI", "PostgreSQL", "pgvector", "Docker", "PyTorch", "LangChain"],
            "experience": [
                {
                    "role": "Principal AI Architect",
                    "company": "VNG Tech Enterprise",
                    "start_date": "2021",
                    "end_date": "Hiện tại",
                    "description": "Chủ trì thiết kế hệ thống tìm kiếm vector phân tán phục vụ hơn 5 triệu truy vấn mỗi ngày với độ trễ p99 dưới 40ms.",
                },
                {
                    "role": "Senior Backend Engineer",
                    "company": "FPT Software",
                    "start_date": "2018",
                    "end_date": "2021",
                    "description": "Tối ưu hóa cơ sở dữ liệu quan hệ và xây dựng API Microservices cho khách hàng tài chính quốc tế.",
                },
            ],
            "projects": [
                {
                    "name": "Enterprise Talent AI Search Engine",
                    "role": "Tech Lead",
                    "tech_stack": ["FastAPI", "pgvector", "OpenAI Embeddings"],
                    "description": "Xây dựng pipeline RAG Hybrid Search với BM25 và Vector Similarity đạt tỷ lệ gợi ý chính xác 92%.",
                }
            ],
            "education": [
                {
                    "school": "Đại học Bách Khoa Hà Nội",
                    "major": "Kỹ sư Công nghệ Thông tin",
                    "start_year": "2013",
                    "end_year": "2018",
                }
            ],
        }

        sim_payload = {
            "document_type": "cv_document",
            "content_json": cv_content,
            "chunk_size": 1000,
            "chunk_overlap": 100,
            "min_chunk_length": 40,
        }

        res = client.post("/admin/rag/simulate-chunking", json=sim_payload, headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()

        assert data["document_type"] == "cv_document"
        assert data["total_chunks"] >= 4
        assert data["effective_chunk_size"] == 1000
        assert len(data["chunks"]) == data["total_chunks"]

        # Verify semantic section tags and context enrichment prefix
        sections = [c["section_type"] for c in data["chunks"]]
        assert "summary" in sections
        assert "experience" in sections
        assert "skills" in sections
        assert any("Nguyễn Văn Chuyên Nghiệp" in c["content"] for c in data["chunks"])

        # Test guardrail warning on empty/stub draft
        stub_payload = {
            "document_type": "cv_document",
            "content_json": {"personal": {"full_name": "Test Stub"}},
        }
        res_stub = client.post("/admin/rag/simulate-chunking", json=stub_payload, headers=headers)
        assert res_stub.status_code == 200
        stub_data = res_stub.json()
        assert len(stub_data["warnings"]) > 0
        assert any("Cảnh báo Tiền kiểm RAG" in w for w in stub_data["warnings"])

    finally:
        # Zero-residue teardown
        db_session.query(User).filter(User.id == admin_id).delete()
        db_session.commit()


def test_admin_rag_live_chunk_simulation_resume_and_job(client: TestClient, db_session: Session):
    """Pillar 2: Live Chunking Simulator Sandbox for uploaded Resumes and Jobs."""
    test_email = "admin_rag_sim_text@jobportal.vn"
    headers, admin_id = _get_admin_headers(client, db_session, test_email)

    try:
        # 1. Simulate Resume text chunking
        resume_text = (
            "Kỹ sư Lập trình Python & Cloud AWS với 5 năm kinh nghiệm thực chiến. "
            "Kỹ năng: Python, FastAPI, Docker, Kubernetes, PostgreSQL, Redis, Celery, ElasticSearch. "
            "Kinh nghiệm làm việc: Tech Lead tại VNPAY từ 2020 đến nay. "
            "Phát triển cổng thanh toán điện tử xử lý hàng triệu giao dịch an toàn mỗi ngày."
        )
        res_resume = client.post(
            "/admin/rag/simulate-chunking",
            json={"document_type": "resume", "text": resume_text, "chunk_size": 500, "chunk_overlap": 50},
            headers=headers,
        )
        assert res_resume.status_code == 200
        data_resume = res_resume.json()
        assert data_resume["document_type"] == "resume"
        assert data_resume["total_chunks"] >= 1

        # 2. Simulate Job listing chunking
        job_text = (
            "Tuyển dụng Senior AI/ML Engineer chịu trách nhiệm xây dựng mô hình gợi ý việc làm thông minh. "
            "Yêu cầu: Thành thạo Python, PyTorch, Transformers, RAG, pgvector, Docker. "
            "Đãi ngộ: Lương hấp dẫn $2500 - $4000, thưởng KPI quý, bảo hiểm sức khỏe toàn diện."
        )
        res_job = client.post(
            "/admin/rag/simulate-chunking",
            json={"document_type": "job", "text": job_text, "chunk_size": 400},
            headers=headers,
        )
        assert res_job.status_code == 200
        data_job = res_job.json()
        assert data_job["document_type"] == "job"
        assert data_job["total_chunks"] >= 1

    finally:
        db_session.query(User).filter(User.id == admin_id).delete()
        db_session.commit()


def test_admin_rag_surgical_reindex_inspection_and_purge(client: TestClient, db_session: Session):
    """Pillar 3: Granular Document Inspection, Surgical Re-index, and Chunk Purge.

    Strict Zero Residue: All created DB rows (candidate user, CV document, chunks) are deleted.
    """
    admin_email = "admin_rag_surgery@jobportal.vn"
    candidate_email = "cand_rag_surgery_test@jobportal.vn"

    headers, admin_id = _get_admin_headers(client, db_session, admin_email)

    # Setup Candidate User and Valid CV Builder Document
    cand_user = User(
        email=candidate_email,
        hashed_password=hash_password("password123"),
        full_name="Ứng viên Thử nghiệm Phẫu thuật",
        role=UserRole.CANDIDATE,
        is_active=True,
    )
    db_session.add(cand_user)
    db_session.commit()
    db_session.refresh(cand_user)

    cv_content = {
        "personal": {
            "full_name": "Ứng viên Phẫu thuật",
            "headline": "DevOps & Cloud Engineer",
            "summary": "Kỹ sư vận hành hệ thống đám mây CI/CD với Kubernetes, Terraform và Docker an toàn tuyệt đối.",
            "location": "Đà Nẵng",
        },
        "skills": ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD", "Linux"],
        "experience": [
            {
                "role": "DevOps Engineer",
                "company": "CloudX Vietnam",
                "start_date": "2022",
                "end_date": "Hiện tại",
                "description": "Vận hành cụm Kubernetes đa vùng, triển khai giám sát Prometheus và Grafana giảm thiểu downtime xuống 0.01%.",
            }
        ],
        "education": [
            {
                "school": "Đại học Bách Khoa Đà Nẵng",
                "major": "Kỹ thuật Máy tính",
                "start_year": "2017",
                "end_year": "2022",
            }
        ],
    }

    cv_doc = CvDocument(
        user_id=cand_user.id,
        title="Hồ sơ DevOps Cloud RAG Test",
        template_key="ats-minimal",
        content_json=cv_content,
        status="published",
    )
    db_session.add(cv_doc)
    db_session.commit()
    db_session.refresh(cv_doc)

    try:
        doc_id = cv_doc.id

        # 1. Surgical Reindex: POST /admin/rag/documents/cv_document/{id}/reindex
        reindex_res = client.post(f"/admin/rag/documents/cv_document/{doc_id}/reindex", headers=headers)
        assert reindex_res.status_code == 200, reindex_res.text
        reindex_data = reindex_res.json()
        assert reindex_data["status"] == "success"
        assert reindex_data["document_id"] == doc_id
        assert reindex_data["indexed_chunks_count"] >= 3

        # 2. Granular Inspection: GET /admin/rag/documents/cv_document/{id}/chunks
        inspect_res = client.get(f"/admin/rag/documents/cv_document/{doc_id}/chunks", headers=headers)
        assert inspect_res.status_code == 200, inspect_res.text
        inspect_data = inspect_res.json()
        assert inspect_data["document_id"] == doc_id
        assert inspect_data["owner_email"] == candidate_email
        assert inspect_data["is_validated"] is True
        assert inspect_data["total_chunks"] == reindex_data["indexed_chunks_count"]
        assert len(inspect_data["chunks"]) == inspect_data["total_chunks"]

        # Check detail fields
        first_chunk = inspect_data["chunks"][0]
        assert "id" in first_chunk
        assert "section_type" in first_chunk
        assert "has_embedding" in first_chunk
        assert first_chunk["char_count"] > 0

        # 3. Chunk Purge: DELETE /admin/rag/documents/cv_document/{id}/chunks
        purge_res = client.delete(f"/admin/rag/documents/cv_document/{doc_id}/chunks", headers=headers)
        assert purge_res.status_code == 200, purge_res.text
        purge_data = purge_res.json()
        assert purge_data["status"] == "purged"
        assert purge_data["chunks_deleted"] == inspect_data["total_chunks"]

        # 4. Verify Inspection now returns 0 chunks
        inspect_after = client.get(f"/admin/rag/documents/cv_document/{doc_id}/chunks", headers=headers)
        assert inspect_after.status_code == 200
        assert inspect_after.json()["total_chunks"] == 0

    finally:
        # STRICT CLEANUP: Delete all chunks, CV document, candidate user, admin user
        db_session.query(DocumentChunk).filter(
            DocumentChunk.document_type == "cv_document",
            DocumentChunk.document_id == cv_doc.id,
        ).delete()
        db_session.query(CvDocument).filter(CvDocument.id == cv_doc.id).delete()
        db_session.query(User).filter(User.id.in_([cand_user.id, admin_id])).delete()
        db_session.commit()

        # Assert no residue in DB
        assert db_session.query(CvDocument).filter(CvDocument.id == cv_doc.id).count() == 0
        assert db_session.query(User).filter(User.id == cand_user.id).count() == 0


def test_admin_rag_orphan_detection_and_purge(client: TestClient, db_session: Session):
    """Pillar 4: pgvector Health & Orphan Diagnostics / Purge.

    Strict Zero Residue: Injects synthetic orphan chunks, detects them, purges them,
    and asserts that zero orphan chunks remain in the database.
    """
    admin_email = "admin_rag_orphan@jobportal.vn"
    headers, admin_id = _get_admin_headers(client, db_session, admin_email)

    # Injected synthetic orphan IDs that definitely do not exist in Resumes or CvDocuments
    synthetic_orphan_doc_id_1 = 99998881
    synthetic_orphan_doc_id_2 = 99998882

    orphan_chunk_1 = DocumentChunk(
        document_type="resume",
        document_id=synthetic_orphan_doc_id_1,
        company_id=None,
        user_id=None,
        section_type="summary",
        chunk_index=0,
        content="Nội dung chunk mồ côi thử nghiệm số 1 không còn bản ghi resume gốc.",
        metadata_json=json.dumps({"test": "orphan_1"}),
    )
    orphan_chunk_2 = DocumentChunk(
        document_type="cv_document",
        document_id=synthetic_orphan_doc_id_2,
        company_id=None,
        user_id=None,
        section_type="skills",
        chunk_index=0,
        content="Nội dung chunk mồ côi thử nghiệm số 2 không còn bản ghi cv_document gốc.",
        metadata_json=json.dumps({"test": "orphan_2"}),
    )
    db_session.add_all([orphan_chunk_1, orphan_chunk_2])
    db_session.commit()

    try:
        # 1. Diagnose Orphans: GET /admin/rag/orphans
        orphan_res = client.get("/admin/rag/orphans", headers=headers)
        assert orphan_res.status_code == 200, orphan_res.text
        orphan_data = orphan_res.json()

        assert orphan_data["total_orphans"] >= 2
        assert orphan_data["orphan_resume_chunks"] >= 1
        assert orphan_data["orphan_cv_document_chunks"] >= 1

        # 2. Purge Orphans: POST /admin/rag/purge-orphans
        purge_res = client.post("/admin/rag/purge-orphans", headers=headers)
        assert purge_res.status_code == 200, purge_res.text
        purge_data = purge_res.json()
        assert purge_data["status"] == "purged"
        assert purge_data["purged_count"] >= 2

        # 3. Verify zero synthetic orphans remain in DB
        verify_res = client.get("/admin/rag/orphans", headers=headers)
        assert verify_res.status_code == 200
        remaining_orphans = verify_res.json()
        assert remaining_orphans["total_orphans"] == 0

        # Direct database query check
        rem_in_db = db_session.query(DocumentChunk).filter(
            DocumentChunk.document_id.in_([synthetic_orphan_doc_id_1, synthetic_orphan_doc_id_2])
        ).count()
        assert rem_in_db == 0, "Synthetic orphan chunks were not completely removed!"

    finally:
        # Extra safety cleanup in case purge failed midway
        db_session.query(DocumentChunk).filter(
            DocumentChunk.document_id.in_([synthetic_orphan_doc_id_1, synthetic_orphan_doc_id_2])
        ).delete()
        db_session.query(User).filter(User.id == admin_id).delete()
        db_session.commit()
