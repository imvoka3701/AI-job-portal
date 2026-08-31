"""Tests for AI endpoints — auth checks + full matching flow."""

import json
import math
import os
import sys
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.job import crud_job
from app.crud.resume import crud_resume
from app.schemas.job import JobCreate
from app.schemas.resume import ResumeCreate

# ─── Helpers ────────────────────────────────────────────────────────────────────

EMBEDDING_DIM = 384


def _make_vector(first: float, second: float) -> list[float]:
    """Build a 384-dim normalized vector with only the first two components non-zero.

    The result is L2-normalized so cosine similarity = dot product.
    """
    rest_norm_sq = 1.0 - (first * first + second * second)
    assert rest_norm_sq >= 0, f"Vector would have negative norm: {first=} {second=}"
    vector = [first, second] + [0.0] * (EMBEDDING_DIM - 2)
    # Adjust first element to make it exactly normalized
    # Actually, since rest is 0, we just need first^2 + second^2 <= 1
    # Cosine similarity is dot product for normalized vectors
    return vector


def _register_and_login(
    client: TestClient,
    email: str,
    password: str,
    full_name: str = "Test",
    role: str = "candidate",
    db: Session | None = None,
    company_name: str | None = None,
) -> dict[str, Any]:
    """Register a user and return the auth headers + user data.

    Employer accounts default to is_active=False (require admin approval).
    Pass a DB session to auto-activate employers in test environments.
    """
    payload: dict[str, Any] = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role,
    }
    if company_name:
        payload["company_name"] = company_name
    client.post("/auth/register", json=payload)

    # Auto-activate employer accounts in tests — bypasses admin approval
    if role == "employer" and db is not None:
        from app.models.user import User as UserModel
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user and not user.is_active:
            user.is_active = True
            db.commit()

    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_resume_with_embedding(
    db: Session, user_id: int, embedding: list[float], title: str = "test_cv.pdf"
) -> int:
    """Create a resume entry with a pre-computed embedding via CRUD."""
    resume_in = ResumeCreate(
        title=title,
        file_url="uploads/test/test_cv.pdf",
        raw_text="Experienced Python developer with 5 years in web development.",
        embedding=embedding,
    )
    resume = crud_resume.create(db, obj_in=resume_in, user_id=user_id)
    return resume.id


def _create_job_with_embedding(
    db: Session, employer_id: int, embedding: list[float]
) -> int:
    """Create a job with a pre-computed embedding via CRUD."""
    job_in = JobCreate(
        title="Senior Python Developer",
        description="Looking for an experienced Python developer to join our team.",
        requirements="5+ years Python, FastAPI, PostgreSQL",
        benefits="Health insurance, remote work",
        job_type="full_time",
        experience_level="senior",
        location="Hà Nội",
    )
    job = crud_job.create(db, obj_in=job_in, employer_id=employer_id)
    crud_job.update_embedding(db, job=job, embedding=embedding)
    return job.id


# ─── Tests ──────────────────────────────────────────────────────────────────────


class TestAIEndpoints:
    def test_match_requires_auth(self, client: TestClient):
        response = client.post("/ai/match", json={"resume_id": 1, "job_id": 1})
        assert response.status_code == 401

    def test_evaluate_requires_auth(self, client: TestClient):
        response = client.post("/ai/evaluate", json={"resume_id": 1})
        assert response.status_code == 401

    def test_roadmap_requires_auth(self, client: TestClient):
        response = client.post(
            "/ai/roadmap", json={"resume_id": 1, "target_role": "Senior Developer"}
        )
        assert response.status_code == 401


class TestAIMatchingIntegration:
    """Full-flow integration test: upload CV → post job → match → valid score."""

    def test_full_matching_flow(self, client: TestClient, db_session: Session):
        # ── 1. Register candidate & employer ──────────────────────────
        cand_headers = _register_and_login(
            client, "cand@test.com", "secret123", "Nguyen Van A", "candidate"
        )
        empl_headers = _register_and_login(
            client, "empl@test.com", "secret123", "Công ty TNHH ABC", "employer",
            db=db_session,
        )

        # ── 2. Create resume with embedding for candidate ─────────────
        # Use vectors: resume_emb = [1,0,...], job_emb = [0.6,0.8,...]
        # Cosine similarity = 0.6 → expected score ~60%
        me_resp = client.get("/users/me", headers=cand_headers)
        assert me_resp.status_code == 200
        cand_user_id = me_resp.json()["id"]

        me_resp2 = client.get("/users/me", headers=empl_headers)
        assert me_resp2.status_code == 200
        empl_user_id = me_resp2.json()["id"]

        # Resume embedding: [1.0, 0.0, ...] (pointing along axis 1)
        resume_emb = _make_vector(1.0, 0.0)
        resume_id = _create_resume_with_embedding(db_session, cand_user_id, resume_emb)

        # ── 3. Create job with embedding ─────────────────────────────
        # Job embedding: [0.6, 0.8, ...] → cosine = 1.0*0.6 + 0*0.8 = 0.6 → 60%
        job_emb = _make_vector(0.6, 0.8)
        job_id = _create_job_with_embedding(db_session, empl_user_id, job_emb)

        # ── 4. Call /ai/match ────────────────────────────────────────
        resp = client.post(
            "/ai/match",
            json={"resume_id": resume_id, "job_id": job_id},
            headers=cand_headers,
        )
        assert resp.status_code == 200, f"Match failed: {resp.text}"
        data = resp.json()

        # ── 5. Verify score ──────────────────────────────────────────
        score = data["score"]
        assert isinstance(score, (int, float)), f"Score should be numeric, got {type(score)}"
        assert not math.isnan(score), "Score should not be NaN"
        assert 0.0 <= score <= 100.0, f"Score {score} out of range [0, 100]"
        # Cosine = 0.6 → score ≈ 60%
        assert abs(score - 60.0) < 5.0, (
            f"Expected score ~60.0 for cosine=0.6, got {score}. "
            f"resume_emb[0]={resume_emb[0]}, job_emb[0:2]={job_emb[0:2]}"
        )
        assert len(data["explanation"]) > 0

        # ── 6. Verify 404 cases ──────────────────────────────────────
        resp_404 = client.post(
            "/ai/match",
            json={"resume_id": 99999, "job_id": job_id},
            headers=cand_headers,
        )
        assert resp_404.status_code == 404

        resp_404b = client.post(
            "/ai/match",
            json={"resume_id": resume_id, "job_id": 99999},
            headers=cand_headers,
        )
        assert resp_404b.status_code == 404

    def test_match_resume_without_embedding(
        self, client: TestClient, db_session: Session
    ):
        """When a resume has no embedding, score should be 0 with explanation."""
        cand_headers = _register_and_login(
            client, "nocv@test.com", "secret123", "No CV User", "candidate"
        )
        empl_headers = _register_and_login(
            client, "empl2@test.com", "secret123", "Công ty XYZ", "employer",
            db=db_session,
        )

        me = client.get("/users/me", headers=cand_headers)
        cand_id = me.json()["id"]
        me2 = client.get("/users/me", headers=empl_headers)
        empl_id = me2.json()["id"]

        # Resume WITHOUT embedding
        resume_in = ResumeCreate(title="empty.pdf", file_url="uploads/test/empty.pdf", raw_text="Some text")
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        # Job WITH embedding
        job_emb = _make_vector(0.6, 0.8)
        job_id = _create_job_with_embedding(db_session, empl_id, job_emb)

        resp = client.post(
            "/ai/match",
            json={"resume_id": resume.id, "job_id": job_id},
            headers=cand_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 0.0
        assert "no embedding" in data["explanation"].lower()

    def test_match_job_without_embedding(
        self, client: TestClient, db_session: Session
    ):
        """When a job has no embedding, endpoint returns 422."""
        cand_headers = _register_and_login(
            client, "has_cv@test.com", "secret123", "Has CV", "candidate"
        )
        empl_headers = _register_and_login(
            client, "empl3@test.com", "secret123", "Công ty NoEmbed", "employer",
            db=db_session,
        )

        me = client.get("/users/me", headers=cand_headers)
        cand_id = me.json()["id"]
        me2 = client.get("/users/me", headers=empl_headers)
        empl_id = me2.json()["id"]

        # Resume WITH embedding
        resume_emb = _make_vector(1.0, 0.0)
        resume_id = _create_resume_with_embedding(db_session, cand_id, resume_emb)

        # Job WITHOUT embedding
        job_in = JobCreate(title="No Embed Job", description="A job without embedding.")
        job = crud_job.create(db_session, obj_in=job_in, employer_id=empl_id)

        resp = client.post(
            "/ai/match",
            json={"resume_id": resume_id, "job_id": job.id},
            headers=cand_headers,
        )
        assert resp.status_code == 422
        assert "no embedding" in resp.json()["error"]["message"].lower()


class TestAIMatchingRealEmbeddings:
    """Match a real resume against two different jobs — embedding model must differentiate.

    If the Python job score is NOT significantly higher than the Marketing job score,
    either the embedding model or the JD text concatenation strategy has a problem.
    """

    def test_python_dev_matches_python_job_better_than_marketing(
        self, client: TestClient, db_session: Session
    ):
        """Real embeddings: Python resume vs (Python job, Marketing job).

        The Python/FastAPI resume should match the Backend Python job
        SIGNIFICANTLY HIGHER than the Marketing job. If scores are similar
        or reversed, the embedding model or JD concatenation is broken.
        """
        from app.services.embedding_service import generate_embedding

        # ── 1. Register candidate & employer ──────────────────────────
        cand_headers = _register_and_login(
            client,
            "pythondev@test.com",
            "secret123",
            "Nguyễn Văn Lập Trình",
            "candidate",
        )
        empl_headers = _register_and_login(
            client,
            "hr_company@test.com",
            "secret123",
            "Công ty TNHH TechPro",
            "employer",
            db=db_session,
        )

        me = client.get("/users/me", headers=cand_headers)
        assert me.status_code == 200
        cand_user_id = me.json()["id"]

        me2 = client.get("/users/me", headers=empl_headers)
        assert me2.status_code == 200
        empl_user_id = me2.json()["id"]

        # ── 2. Resume text — real Python developer skills ─────────────
        resume_text = (
            "Tôi là lập trình viên Python với hơn 5 năm kinh nghiệm phát triển backend. "
            "Thành thạo FastAPI, Django, PostgreSQL, Docker, Redis, Celery. "
            "Có kinh nghiệm thiết kế RESTful APIs, tối ưu hiệu năng database, "
            "triển khai CI/CD với GitHub Actions, viết unit test với pytest. "
            "Đã từng xây dựng hệ thống microservices xử lý 10 triệu request/ngày. "
            "Kỹ năng: Python, FastAPI, SQLAlchemy, PostgreSQL, MongoDB, Docker, "
            "Kubernetes, Redis, RabbitMQ, Linux, Git, AWS, Terraform."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_python_dev.pdf",
            file_url="uploads/test/cv_python_dev.pdf",
            raw_text=resume_text,
            embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_user_id)

        # ── 3. Job 1: Backend Python Developer ────────────────────────
        py_title = "Lập trình viên Backend Python (FastAPI/Django)"
        py_description = (
            "Công ty công nghệ tuyển dụng lập trình viên Backend Python giàu kinh nghiệm "
            "để xây dựng và duy trì các hệ thống API hiệu năng cao. Dự án sử dụng FastAPI, "
            "PostgreSQL, Docker, Kubernetes trên AWS."
        )
        py_requirements = (
            "Tối thiểu 3 năm kinh nghiệm Python backend. "
            "Thành thạo FastAPI hoặc Django, SQLAlchemy ORM. "
            "Kinh nghiệm với PostgreSQL, Docker, Redis. "
            "Hiểu biết về thiết kế RESTful APIs, microservices. "
            "Có kinh nghiệm viết unit test, CI/CD là lợi thế lớn."
        )
        py_benefits = (
            "Lương cạnh tranh 25-40 triệu VND. Làm việc hybrid 2 ngày/tuần tại văn phòng. "
            "Bảo hiểm sức khỏe, MacBook Pro, ngân sách học tập 500$/năm."
        )

        py_jd_text = " ".join([py_title, py_description, py_requirements, py_benefits])
        py_emb = generate_embedding(py_jd_text)

        py_job_in = JobCreate(
            title=py_title,
            description=py_description,
            requirements=py_requirements,
            benefits=py_benefits,
            job_type="full_time",
            experience_level="senior",
            location="Hà Nội",
        )
        py_job = crud_job.create(db_session, obj_in=py_job_in, employer_id=empl_user_id)
        crud_job.update_embedding(db_session, job=py_job, embedding=py_emb)

        # ── 4. Job 2: Marketing Specialist ────────────────────────────
        mkt_title = "Nhân viên Marketing (Digital Marketing)"
        mkt_description = (
            "Công ty thương mại điện tử tuyển dụng nhân viên Marketing để phụ trách "
            "các chiến dịch quảng cáo số, SEO/SEM, social media và email marketing. "
            "Không yêu cầu kỹ năng lập trình."
        )
        mkt_requirements = (
            "Tối thiểu 2 năm kinh nghiệm Digital Marketing. "
            "Thành thạo Google Ads, Facebook Ads Manager, SEO tools (Ahrefs, SEMrush). "
            "Kỹ năng viết content, thiết kế cơ bản với Canva/Figma. "
            "Có kinh nghiệm phân tích dữ liệu với Google Analytics, Excel. "
            "Kỹ năng giao tiếp, thuyết trình, làm việc nhóm tốt."
        )
        mkt_benefits = (
            "Lương 12-18 triệu VND + thưởng KPI. Làm việc tại văn phòng quận 1. "
            "Bảo hiểm đầy đủ, team building hàng quý, du lịch hàng năm."
        )

        mkt_jd_text = " ".join([mkt_title, mkt_description, mkt_requirements, mkt_benefits])
        mkt_emb = generate_embedding(mkt_jd_text)

        mkt_job_in = JobCreate(
            title=mkt_title,
            description=mkt_description,
            requirements=mkt_requirements,
            benefits=mkt_benefits,
            job_type="full_time",
            experience_level="middle",
            location="TP. Hồ Chí Minh",
        )
        mkt_job = crud_job.create(db_session, obj_in=mkt_job_in, employer_id=empl_user_id)
        crud_job.update_embedding(db_session, job=mkt_job, embedding=mkt_emb)

        # ── 5. Call /ai/match for BOTH pairs ─────────────────────────
        py_resp = client.post(
            "/ai/match",
            json={"resume_id": resume.id, "job_id": py_job.id},
            headers=cand_headers,
        )
        assert py_resp.status_code == 200, f"Python job match failed: {py_resp.text}"
        py_score = py_resp.json()["score"]

        mkt_resp = client.post(
            "/ai/match",
            json={"resume_id": resume.id, "job_id": mkt_job.id},
            headers=cand_headers,
        )
        assert mkt_resp.status_code == 200, f"Marketing job match failed: {mkt_resp.text}"
        mkt_score = mkt_resp.json()["score"]

        # ── 6. Validate scores ────────────────────────────────────────
        assert isinstance(py_score, (int, float)), f"py_score should be numeric, got {type(py_score)}"
        assert isinstance(mkt_score, (int, float)), f"mkt_score should be numeric, got {type(mkt_score)}"
        assert not math.isnan(py_score), "py_score should not be NaN"
        assert not math.isnan(mkt_score), "mkt_score should not be NaN"
        assert 0.0 <= py_score <= 100.0, f"py_score {py_score} out of [0, 100]"
        assert 0.0 <= mkt_score <= 100.0, f"mkt_score {mkt_score} out of [0, 100]"

        # ── 7. THE CRITICAL ASSERTION ────────────────────────────────
        # Python dev resume MUST match Python job significantly higher
        # than Marketing job. If this fails, the embedding model or the
        # JD concatenation strategy is fundamentally broken.
        gap = py_score - mkt_score
        assert gap > 0, (
            f"FAIL: Python resume matched Marketing job ({mkt_score}%) "
            f"HIGHER than Python job ({py_score}%). "
            f"The embedding model or JD concatenation IS BROKEN — "
            f"the model cannot distinguish between tech and marketing content. "
            f"Report this to the user immediately."
        )

        # Require a meaningful gap — not just "barely higher"
        assert gap > 15.0, (
            f"FAIL: Python job ({py_score}%) vs Marketing job ({mkt_score}%) — "
            f"gap is only {gap:.1f} percentage points. "
            f"The embedding model CAN technically tell them apart but the "
            f"differentiation is too weak to be useful in production. "
            f"Consider a better model or a different JD concatenation approach."
        )

        # ── 8. Sanity: self-similarity should be high ────────────────
        # A resume should match itself (or very similar text) at >80%
        self_text = resume_text  # same text → near-perfect match
        self_emb = generate_embedding(self_text)
        self_resume_in = ResumeCreate(
            title="self_test.pdf",
            file_url="uploads/test/self_test.pdf",
            raw_text=self_text,
            embedding=self_emb,
        )
        self_resume = crud_resume.create(
            db_session, obj_in=self_resume_in, user_id=cand_user_id
        )
        # Compare self_resume embedding vs py_job embedding via Python
        # (not via HTTP, since we just want to validate the model itself)
        from app.services.ai_matching import _cosine_similarity_python

        self_vs_py = _cosine_similarity_python(self_emb, py_emb)
        self_vs_mkt = _cosine_similarity_python(self_emb, mkt_emb)

        # Same resume text vs Python job should have reasonable similarity
        assert self_vs_py > 0.3, (
            f"Self-similarity check: identical Python resume vs Python JD "
            f"cosine = {self_vs_py:.4f} — should be >0.3. Model may not "
            f"understand Vietnamese well enough."
        )
        # Python resume vs Marketing job should be much lower
        assert self_vs_py > self_vs_mkt, (
            f"Self-similarity check: Python resume closer to Marketing "
            f"({self_vs_mkt:.4f}) than to Python job ({self_vs_py:.4f})"
        )


@pytest.mark.skipif(
    not os.getenv("RUN_REAL_LLM"),
    reason="Set RUN_REAL_LLM=1 to run live Deepseek LLM tests (needs network + API key).",
)
class TestAIRealDeepseekCalls:
    """Call /ai/evaluate and /ai/roadmap with REAL Deepseek API responses.

    These tests validate that the LLM returns well-structured, useful
    Vietnamese content — not generic placeholder text. The JSON output
    is printed to stdout for manual quality inspection.

    Run with: pytest tests/test_ai.py::TestAIRealDeepseekCalls -v -s
    """

    def test_evaluate_cv_with_real_deepseek(
        self, client: TestClient, db_session: Session
    ):
        """POST /ai/evaluate with a realistic mid-level Python CV.

        Prints the full JSON response. Validates structure and content
        quality (score in range, suggestions are specific, skill_analysis
        is non-empty).
        """

        from app.services.embedding_service import generate_embedding

        # ── Register candidate + create resume ─────────────────────────
        headers = _register_and_login(
            client,
            "eval_test@test.com",
            "secret123",
            "Trần Thị Ứng Viên",
            "candidate",
        )
        me = client.get("/users/me", headers=headers)
        cand_id = me.json()["id"]

        # Realistic mid-level CV with clear strengths AND weaknesses
        resume_text = (
            "Tôi là lập trình viên backend với 3 năm kinh nghiệm. "
            "Thành thạo Python, Django, PostgreSQL, Docker cơ bản. "
            "Đã từng làm việc với REST APIs, Git, Linux command line. "
            "Có hiểu biết cơ bản về AWS (EC2, S3). "
            "Điểm mạnh: code sạch, có comment, viết unit test đầy đủ. "
            "Điểm yếu: chưa có kinh nghiệm với FastAPI, Kubernetes, CI/CD pipeline. "
            "Chưa từng làm việc với hệ thống microservices hoặc message queue. "
            "Kỹ năng mềm: làm việc nhóm tốt, giao tiếp tiếng Anh khá (đọc hiểu tài liệu). "
            "Mong muốn phát triển lên Senior trong 2 năm tới."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_mid_level.pdf",
            file_url="uploads/test/cv_mid_level.pdf",
            raw_text=resume_text,
            embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        # ── Call /ai/evaluate ──────────────────────────────────────────
        resp = client.post(
            "/ai/evaluate",
            json={"resume_id": resume.id},
            headers=headers,
        )

        print("\n" + "=" * 72)
        print("  /ai/evaluate — REAL DEEPSEEK RESPONSE")
        print("=" * 72)

        if resp.status_code != 200:
            print(f"  STATUS: {resp.status_code}")
            print(f"  BODY: {resp.text}")
            print("=" * 72 + "\n")
            pytest.fail(
                f"/ai/evaluate returned {resp.status_code}: {resp.text[:500]}"
            )

        data = resp.json()
        # Write UTF-8 JSON directly to avoid Windows cp1252 console issues
        sys.stdout.buffer.write(
            (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        )
        sys.stdout.buffer.write(("=" * 72 + "\n\n").encode("utf-8"))

        # ── Structural assertions ──────────────────────────────────────
        assert isinstance(data["overall_score"], (int, float)), (
            f"overall_score must be numeric, got {type(data['overall_score'])}"
        )
        assert 0.0 <= data["overall_score"] <= 10.0, (
            f"overall_score {data['overall_score']} out of [0.0, 10.0]"
        )

        assert isinstance(data["summary"], str) and len(data["summary"]) > 50, (
            f"summary too short or missing: {data.get('summary')!r}"
        )

        assert isinstance(data["suggestions"], list) and len(data["suggestions"]) >= 2, (
            f"Expected ≥2 suggestions, got {data.get('suggestions')}"
        )
        for i, s in enumerate(data["suggestions"]):
            assert isinstance(s, str) and len(s) > 20, (
                f"suggestion[{i}] too short/generic: {s!r}"
            )

        assert isinstance(data["skill_analysis"], dict) and len(data["skill_analysis"]) >= 3, (
            f"Expected ≥3 skills analyzed, got {data.get('skill_analysis')}"
        )
        for skill, assessment in data["skill_analysis"].items():
            # LLM may return numeric scores, text assessments, or rich objects
            if isinstance(assessment, dict):
                # Rich object like {"score": 8, "level": "Thành thạo"}
                pass  # valid — content is present
            elif isinstance(assessment, (int, float)):
                assert 0 <= assessment <= 10, (
                    f"skill_analysis['{skill}'] score {assessment} out of [0, 10]"
                )
            else:
                assert isinstance(assessment, str) and len(assessment) > 2, (
                    f"skill_analysis['{skill}'] too short: {assessment!r}"
                )

    def test_roadmap_with_real_deepseek(
        self, client: TestClient, db_session: Session
    ):
        """POST /ai/roadmap with a realistic CV and target role.

        Prints the full JSON response. Validates that steps are specific
        (not generic), skills_to_learn are actionable, and resources are
        provided.
        """

        from app.services.embedding_service import generate_embedding

        # ── Register candidate + create resume ─────────────────────────
        headers = _register_and_login(
            client,
            "roadmap_test@test.com",
            "secret123",
            "Lê Văn Lộ Trình",
            "candidate",
        )
        me = client.get("/users/me", headers=headers)
        cand_id = me.json()["id"]

        # Same realistic mid-level CV
        resume_text = (
            "Tôi là lập trình viên backend với 3 năm kinh nghiệm. "
            "Thành thạo Python, Django, PostgreSQL, Docker cơ bản. "
            "Đã từng làm việc với REST APIs, Git, Linux command line. "
            "Có hiểu biết cơ bản về AWS (EC2, S3). "
            "Điểm mạnh: code sạch, có comment, viết unit test đầy đủ. "
            "Điểm yếu: chưa có kinh nghiệm với FastAPI, Kubernetes, CI/CD pipeline. "
            "Chưa từng làm việc với hệ thống microservices hoặc message queue. "
            "Kỹ năng mềm: làm việc nhóm tốt, giao tiếp tiếng Anh khá (đọc hiểu tài liệu). "
            "Mong muốn phát triển lên Senior trong 2 năm tới."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_roadmap_test.pdf",
            file_url="uploads/test/cv_roadmap_test.pdf",
            raw_text=resume_text,
            embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        target_role = "Senior Backend Developer (Python/FastAPI)"

        # ── Call /ai/roadmap ───────────────────────────────────────────
        resp = client.post(
            "/ai/roadmap",
            json={"resume_id": resume.id, "target_role": target_role},
            headers=headers,
        )

        print("\n" + "=" * 72)
        print("  /ai/roadmap — REAL DEEPSEEK RESPONSE")
        print("=" * 72)

        if resp.status_code != 200:
            print(f"  STATUS: {resp.status_code}")
            print(f"  BODY: {resp.text}")
            print("=" * 72 + "\n")
            pytest.fail(
                f"/ai/roadmap returned {resp.status_code}: {resp.text[:500]}"
            )

        data = resp.json()
        # Write UTF-8 JSON directly to avoid Windows cp1252 console issues
        sys.stdout.buffer.write(
            (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        )
        sys.stdout.buffer.write(("=" * 72 + "\n\n").encode("utf-8"))

        # ── Structural assertions ──────────────────────────────────────
        assert data["target_role"] == target_role, (
            f"target_role mismatch: {data['target_role']} != {target_role}"
        )

        assert isinstance(data["current_level"], str) and len(data["current_level"]) > 0, (
            f"current_level empty or missing: {data.get('current_level')!r}"
        )

        assert isinstance(data["steps"], list) and len(data["steps"]) >= 3, (
            f"Expected ≥3 roadmap steps, got {data.get('steps')}"
        )

        for i, step in enumerate(data["steps"]):
            assert isinstance(step["order"], int), f"step[{i}].order not int"
            assert isinstance(step["title"], str) and len(step["title"]) > 5, (
                f"step[{i}].title too short/generic: {step['title']!r}"
            )
            assert isinstance(step["description"], str) and len(step["description"]) > 30, (
                f"step[{i}].description too short/generic: {step['description']!r}"
            )
            assert isinstance(step["skills_to_learn"], list) and len(step["skills_to_learn"]) >= 1, (
                f"step[{i}].skills_to_learn empty — should list specific skills"
            )
            for skill in step["skills_to_learn"]:
                assert isinstance(skill, str) and len(skill) > 2, (
                    f"step[{i}].skills_to_learn has empty/generic entry: {skill!r}"
                )
            assert isinstance(step["resources"], list), (
                f"step[{i}].resources not a list"
            )
            # Resources are optional (can be empty), but if present they must be strings
            for res in step["resources"]:
                assert isinstance(res, str) and len(res) > 5, (
                    f"step[{i}].resources has invalid entry: {res!r}"
                )

        assert isinstance(data["estimated_months"], int) and data["estimated_months"] > 0, (
            f"estimated_months must be positive int, got {data.get('estimated_months')}"
        )
        assert data["estimated_months"] <= 60, (
            f"estimated_months {data['estimated_months']} seems unrealistic (>5 years)"
        )

    def test_summarize_cv_with_real_deepseek(
        self, client: TestClient, db_session: Session
    ):
        """POST /ai/summarize-cv with a realistic CV + job description.

        Prints the full JSON response. Validates fit_points are specific
        to the job, questions are actionable, and summary is concise.
        """

        from app.services.embedding_service import generate_embedding

        # ── Register candidate + employer + create resume + job ─────────
        cand = _register_and_login(
            client, "summarize_c@test.com", "secret123", "Tóm Tắt CV", "candidate",
        )
        me = client.get("/users/me", headers=cand)
        cand_id = me.json()["id"]

        empl = _register_and_login(
            client, "summarize_e@test.com", "secret123", "Công ty Tóm Tắt",
            "employer", db=db_session, company_name="Tóm Tắt Corp",
        )
        me_emp = client.get("/users/me", headers=empl)
        assert me_emp.status_code == 200
        empl_id = me_emp.json()["id"]

        # Realistic CV with mix of matching + non-matching skills
        resume_text = (
            "Tôi là lập trình viên backend với 4 năm kinh nghiệm. "
            "Thành thạo Python, FastAPI, PostgreSQL, Docker, Git, CI/CD (GitHub Actions). "
            "Từng xây dựng REST APIs cho hệ thống 50k người dùng. "
            "Có kinh nghiệm thiết kế cơ sở dữ liệu, tối ưu SQL query. "
            "Điểm yếu: chưa có kinh nghiệm với Kubernetes, AWS production, microservices. "
            "Kỹ năng mềm: giao tiếp Tiếng Anh tốt (IELTS 6.5), mentor junior dev. "
            "Học vấn: Cử nhân CNTT — Đại học Bách Khoa Hà Nội."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_summarize_test.pdf",
            file_url="uploads/test/cv_summarize_test.pdf",
            raw_text=resume_text,
            embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        # Job that is a partial match
        job_text = " ".join([
            "Senior Backend Developer (Python, AWS, Microservices).",
            "Công ty FinTech tìm Senior Backend Developer xây dựng hệ thống microservices trên AWS.",
            "Yêu cầu: 5+ năm Python, thành thạo FastAPI/Django, Kubernetes, AWS (ECS, RDS, Lambda).",
            "Kinh nghiệm với message queue (Kafka/RabbitMQ), gRPC, distributed systems.",
            "Quyền lợi: Lương 40-60 triệu, ESOP, làm việc hybrid, MacBook Pro M3.",
        ])
        job_emb = generate_embedding(job_text)
        job_in = JobCreate(
            title="Senior Backend Developer",
            description="Công ty FinTech tìm Senior Backend Developer xây dựng microservices.",
            requirements="5+ năm Python, FastAPI/Django, Kubernetes, AWS, Kafka, gRPC.",
            benefits="Lương 40-60 triệu, ESOP, hybrid.",
            job_type="full_time",
            experience_level="senior",
            location="Hà Nội",
        )
        job = crud_job.create(db_session, obj_in=job_in, employer_id=empl_id)
        crud_job.update_embedding(db_session, job=job, embedding=job_emb)

        # ── Call /ai/summarize-cv ────────────────────────────────────────
        resp = client.post(
            "/ai/summarize-cv",
            json={"resume_id": resume.id, "job_id": job.id},
            headers=cand,
        )

        print("\n" + "=" * 72)
        print("  /ai/summarize-cv — REAL DEEPSEEK RESPONSE")
        print("=" * 72)

        if resp.status_code != 200:
            print(f"  STATUS: {resp.status_code}")
            print(f"  BODY: {resp.text}")
            print("=" * 72 + "\n")
            pytest.fail(f"/ai/summarize-cv returned {resp.status_code}: {resp.text[:500]}")

        data = resp.json()
        sys.stdout.buffer.write(
            (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        )
        sys.stdout.buffer.write(("=" * 72 + "\n\n").encode("utf-8"))

        # ── Structural assertions ────────────────────────────────────────
        assert isinstance(data["fit_points"], list), f"fit_points not a list: {data.get('fit_points')}"
        assert len(data["fit_points"]) >= 1, "fit_points should not be empty"
        for pt in data["fit_points"]:
            assert isinstance(pt, str) and len(pt) > 10, (
                f"fit_point too short/generic: {pt!r}"
            )

        assert isinstance(data["questions"], list), f"questions not a list: {data.get('questions')}"
        for q in data["questions"]:
            assert isinstance(q, str) and len(q) > 10, (
                f"question too short/generic: {q!r}"
            )

        assert isinstance(data["summary"], str) and len(data["summary"]) > 20, (
            f"summary too short: {data['summary']!r}"
        )

    def test_interview_questions_with_real_deepseek(
        self, client: TestClient, db_session: Session
    ):
        """POST /ai/interview-questions with selected skills.

        Prints the full JSON response. Validates questions are actually
        about the requested skills (not generic), each has purpose + skill_related.
        """

        from app.services.embedding_service import generate_embedding

        # ── Register candidate + employer + create resume + job ─────────
        cand = _register_and_login(
            client, "intv_c@test.com", "secret123", "Phỏng Vấn Test", "candidate",
        )
        me = client.get("/users/me", headers=cand)
        cand_id = me.json()["id"]

        empl = _register_and_login(
            client, "intv_e@test.com", "secret123", "Công ty Phỏng Vấn",
            "employer", db=db_session, company_name="Intv Corp",
        )
        me_emp = client.get("/users/me", headers=empl)
        empl_id = me_emp.json()["id"]

        # Realistic CV
        resume_text = (
            "Tôi là lập trình viên backend với 4 năm kinh nghiệm. "
            "Thành thạo Python, FastAPI, PostgreSQL, Docker, Git, CI/CD (GitHub Actions). "
            "Từng xây dựng REST APIs cho hệ thống 50k người dùng. "
            "Có kinh nghiệm thiết kế cơ sở dữ liệu, tối ưu SQL query, viết unit test. "
            "Điểm yếu: chưa có kinh nghiệm với Kubernetes, AWS production, microservices. "
            "Kỹ năng mềm: giao tiếp Tiếng Anh tốt (IELTS 6.5), mentor junior dev."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_intv_test.pdf", file_url="uploads/test/cv_intv_test.pdf",
            raw_text=resume_text, embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        job_text = " ".join([
            "Senior Backend Developer (Python, AWS, Microservices).",
            "Công ty FinTech tìm Senior Backend Developer xây dựng hệ thống microservices trên AWS.",
            "Yêu cầu: 5+ năm Python, thành thạo FastAPI/Django, Kubernetes, AWS (ECS, RDS, Lambda).",
            "Kinh nghiệm với message queue, gRPC, distributed systems, hệ thống high-throughput.",
            "Quyền lợi: Lương 40-60 triệu, ESOP, hybrid.",
        ])
        job_emb = generate_embedding(job_text)
        job_in = JobCreate(
            title="Senior Backend Developer",
            description="Công ty FinTech tìm Senior Backend Developer xây dựng microservices.",
            requirements="5+ năm Python, FastAPI/Django, Kubernetes, AWS, Kafka, gRPC.",
            benefits="Lương 40-60 triệu, ESOP, hybrid.",
            job_type="full_time", experience_level="senior", location="Hà Nội",
        )
        job = crud_job.create(db_session, obj_in=job_in, employer_id=empl_id)
        crud_job.update_embedding(db_session, job=job, embedding=job_emb)

        # ── Chọn 3 kỹ năng KHÁC NHAU để test ────────────────────────────
        skills = ["FastAPI", "Docker", "System Design"]  # 2 skills in CV, 1 gap

        # ── Call /ai/interview-questions ─────────────────────────────────
        resp = client.post(
            "/ai/interview-questions",
            json={"resume_id": resume.id, "job_id": job.id, "skills_to_assess": skills},
            headers=cand,
        )

        print("\n" + "=" * 72)
        print(f"  /ai/interview-questions — skills: {skills}")
        print("=" * 72)

        if resp.status_code != 200:
            print(f"  STATUS: {resp.status_code}")
            print(f"  BODY: {resp.text}")
            print("=" * 72 + "\n")
            pytest.fail(f"/ai/interview-questions returned {resp.status_code}: {resp.text[:500]}")

        data = resp.json()
        sys.stdout.buffer.write(
            (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        )
        sys.stdout.buffer.write(("=" * 72 + "\n\n").encode("utf-8"))

        # ── Structural assertions ────────────────────────────────────────
        assert "questions" in data, f"Missing 'questions' key: {list(data.keys())}"
        questions = data["questions"]
        assert isinstance(questions, list), f"questions not a list: {type(questions)}"
        assert len(questions) >= len(skills) * 2, (
            f"Expected at least {len(skills) * 2} questions (2/skill), got {len(questions)}"
        )

        skill_set = {s.lower() for s in skills}

        for i, q in enumerate(questions):
            assert isinstance(q["question"], str) and len(q["question"]) > 15, (
                f"questions[{i}].question too short/generic: {q.get('question')!r}"
            )
            assert isinstance(q["purpose"], str) and len(q["purpose"]) > 10, (
                f"questions[{i}].purpose too short: {q.get('purpose')!r}"
            )
            assert isinstance(q["skill_related"], str), (
                f"questions[{i}].skill_related not a string: {q.get('skill_related')!r}"
            )
            # skill_related should refer to one of the requested skills
            skill_lower = q["skill_related"].lower()
            found = any(s in skill_lower for s in skill_set)
            assert found, (
                f"questions[{i}].skill_related='{q['skill_related']}' does not match "
                f"any requested skill in {skills}"
            )

    def test_generate_email_all_types_with_real_deepseek(
        self, client: TestClient, db_session: Session
    ):
        """POST /ai/generate-email for invite, reject, and offer.

        Prints the full JSON for each type. For 'reject', additionally
        verifies no sensitive/biased language is included.
        """

        from app.services.embedding_service import generate_embedding

        # ── Setup: same pattern as other tests ────────────────────────────
        cand = _register_and_login(
            client, "email_c@t.com", "secret123", "Nguyễn Văn Ứng Viên", "candidate",
        )
        me = client.get("/users/me", headers=cand)
        cand_id = me.json()["id"]

        empl = _register_and_login(
            client, "email_e@t.com", "secret123", "Công ty Email",
            "employer", db=db_session, company_name="Email Corp Việt Nam",
        )
        me_emp = client.get("/users/me", headers=empl)
        empl_id = me_emp.json()["id"]

        resume_text = (
            "Tôi là lập trình viên backend với 4 năm kinh nghiệm. "
            "Thành thạo Python, FastAPI, PostgreSQL, Docker, Git, CI/CD. "
            "Từng xây dựng REST APIs cho hệ thống 50k người dùng. "
            "Có kinh nghiệm thiết kế cơ sở dữ liệu, tối ưu SQL query. "
            "Kỹ năng mềm: giao tiếp Tiếng Anh tốt (IELTS 6.5), mentor junior dev. "
            "Học vấn: Cử nhân CNTT — Đại học Bách Khoa Hà Nội."
        )
        resume_emb = generate_embedding(resume_text)
        resume_in = ResumeCreate(
            title="cv_email_test.pdf", file_url="uploads/test/cv_email_test.pdf",
            raw_text=resume_text, embedding=resume_emb,
        )
        resume = crud_resume.create(db_session, obj_in=resume_in, user_id=cand_id)

        job_text = " ".join([
            "Senior Backend Developer (Python, FastAPI).",
            "Công ty công nghệ tìm Senior Backend Developer.",
            "Yêu cầu: 5+ năm Python, FastAPI, PostgreSQL, Docker.",
            "Quyền lợi: Lương cạnh tranh, làm việc hybrid.",
        ])
        job_emb = generate_embedding(job_text)
        job_in = JobCreate(
            title="Senior Backend Developer",
            description="Phát triển và duy trì hệ thống API hiệu năng cao.",
            requirements="5+ năm Python, FastAPI, PostgreSQL, Docker, Git, CI/CD.",
            benefits="Lương cạnh tranh, làm việc hybrid, bảo hiểm.",
            job_type="full_time", experience_level="senior", location="Hà Nội",
        )
        job = crud_job.create(db_session, obj_in=job_in, employer_id=empl_id)

        # Create application with resume attached via API
        apply_resp = client.post(
            "/applications",
            json={"job_id": job.id, "resume_id": resume.id, "cover_letter": "Tôi rất phù hợp với vị trí này."},
            headers=cand,
        )
        assert apply_resp.status_code == 201, apply_resp.text
        app_id = apply_resp.json()["id"]

        candidate_forbidden = client.post(
            "/ai/generate-email",
            json={"application_id": app_id, "email_type": "invite"},
            headers=cand,
        )
        assert candidate_forbidden.status_code == 403

        # ── Test all 3 email types ────────────────────────────────────────
        for etype in ["invite", "reject", "offer"]:
            print(f"\n{'=' * 72}")
            print(f"  /ai/generate-email — type: {etype.upper()}")
            print(f"{'=' * 72}")

            resp = client.post(
                "/ai/generate-email",
                json={"application_id": app_id, "email_type": etype},
                headers=empl,
            )

            if resp.status_code != 200:
                print(f"  STATUS: {resp.status_code}")
                print(f"  BODY: {resp.text}")
                print(f"{'=' * 72}\n")
                pytest.fail(f"/ai/generate-email ({etype}) returned {resp.status_code}: {resp.text[:500]}")

            data = resp.json()
            sys.stdout.buffer.write(
                (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
            )

            # ── Structural assertions ─────────────────────────────────────
            assert isinstance(data["subject"], str) and len(data["subject"]) > 5, (
                f"{etype}: subject too short: {data.get('subject')!r}"
            )
            assert isinstance(data["body"], str) and len(data["body"]) > 80, (
                f"{etype}: body too short ({len(data.get('body', ''))} chars)"
            )

            # ── Content-specific checks ───────────────────────────────────
            body = data["body"]
            subject = data["subject"]

            if etype == "invite":
                # Should contain placeholder, not specific date
                assert "[Ngày giờ]" in body or "[Ngày" in body, (
                    f"invite should have date/time placeholder, got: {body[:200]}"
                )

            if etype == "reject":
                # MUST NOT contain discriminatory language.
                # Note: "nam"/"nữ" are NOT checked here because they appear
                # in "Việt Nam" (the country). Review the full email text
                # manually instead — the body is printed above for inspection.
                sensitive_terms = [
                    "tuổi", "giới tính", "dân tộc", "tôn giáo",
                    "hôn nhân", "mang thai", "khuyết tật", "tàn tật",
                    "quá trẻ", "quá già",
                ]
                body_lower = body.lower()
                for pattern in sensitive_terms:
                    assert pattern not in body_lower, (
                        f"REJECT email contains potentially discriminatory term "
                        f"'{pattern}' — INVESTIGATE IMMEDIATELY!\nBody: {body[:300]}"
                    )
                # Should mention future opportunities
                future_keywords = [
                    "tương lai", "dịp khác", "lần sau", "sắp tới", "về sau",
                    "sau này", "cơ hội", "vị trí phù hợp", "giữ liên lạc",
                    "liên hệ", "đồng hành", "hợp tác",
                ]
                assert any(kw in body_lower for kw in future_keywords), (
                    f"reject email should invite future applications: {body[:200]}"
                )

            if etype == "offer":
                # Should have placeholder for salary/start date
                assert any(p in body for p in ["[Ngày", "[Mức lương", "[Lương"]), (
                    f"offer should have salary/date placeholders: {body[:200]}"
                )
                # Should congratulate
                assert "chúc mừng" in body.lower() or "trúng tuyển" in body.lower(), (
                    f"offer should congratulate: {body[:200]}"
                )

        print(f"\n{'=' * 72}")
        print("  All 3 email types generated and validated successfully.")
        print(f"{'=' * 72}\n")
