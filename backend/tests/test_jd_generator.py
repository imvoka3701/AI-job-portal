"""Tests for AI JD Generator endpoint POST /ai/generate-jd."""

from unittest.mock import AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.job import JobCategory
from app.models.user import User as UserModel


def _register_and_login_employer(
    client: TestClient,
    db: Session,
    email: str = "hr_finance@company.com",
    password: str = "secret123",
    company_name: str = "Tập đoàn Tài chính Vina",
) -> dict[str, str]:
    payload = {
        "email": email,
        "password": password,
        "full_name": "Nguyen Thi HR",
        "role": "employer",
        "company_name": company_name,
    }
    client.post("/auth/register", json=payload)

    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user and not user.is_active:
        user.is_active = True
        db.commit()

    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestJDGenerator:
    def test_generate_jd_requires_auth(self, client: TestClient):
        resp = client.post("/ai/generate-jd", json={"job_title": "Chuyên viên Marketing"})
        assert resp.status_code == 401

    def test_generate_jd_candidate_forbidden(self, client: TestClient):
        # Register a candidate
        client.post(
            "/auth/register",
            json={
                "email": "candidate_test@test.com",
                "password": "secret123",
                "full_name": "Ứng viên A",
                "role": "candidate",
            },
        )
        login_resp = client.post(
            "/auth/login", json={"email": "candidate_test@test.com", "password": "secret123"}
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/ai/generate-jd",
            json={"job_title": "Chuyên viên Marketing"},
            headers=headers,
        )
        assert resp.status_code == 403

    def test_generate_jd_validation_error(self, client: TestClient, db_session: Session):
        headers = _register_and_login_employer(client, db_session, email="hr_val@company.com")
        resp = client.post(
            "/ai/generate-jd",
            json={"job_title": " "},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_generate_jd_success_fallback(self, client: TestClient, db_session: Session):
        """When LLM is not called or fails, fallback provides comprehensive multi-industry JD."""
        # Setup sample JobCategory
        cat = JobCategory(name="Tài chính - Ngân hàng", slug="tai-chinh-ngan-hang")
        db_session.add(cat)
        db_session.commit()

        headers = _register_and_login_employer(
            client,
            db_session,
            email="hr_bank@bank.com",
            company_name="Ngân hàng TMCP Việt Nam",
        )

        resp = client.post(
            "/ai/generate-jd",
            json={
                "job_title": "Chuyên viên Thẩm định Tín dụng Doanh nghiệp",
                "industry": "Tài chính - Ngân hàng",
                "experience_level": "senior",
                "job_type": "full_time",
                "key_notes": "Yêu cầu có chứng chỉ CFA hoặc CPA là điểm cộng lớn.",
            },
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert "Chuyên viên Thẩm định Tín dụng Doanh nghiệp" in data["title"]
        assert len(data["description"]) > 50
        assert len(data["requirements"]) > 50
        assert len(data["benefits"]) > 50
        assert isinstance(data["suggested_skills"], list)
        assert len(data["suggested_skills"]) >= 2
        assert data["salary_min"] >= 10000000
        assert data["salary_max"] >= data["salary_min"]
        assert data["experience_level"] == "senior"
        assert data["suggested_category_id"] == cat.id

    def test_generate_jd_with_mocked_llm(
        self, client: TestClient, db_session: Session, monkeypatch
    ):
        """Verify proper parsing when DeepSeek returns valid JSON response."""
        from app.services.deepseek_client import deepseek_client

        mock_content = {
            "title": "Trưởng phòng Digital Marketing B2B",
            "description": "• Hoạch định chiến lược tiếp thị đa kênh...\n• Quản lý ngân sách 500 triệu/tháng.",
            "requirements": "• Có 5+ năm kinh nghiệm quản lý Marketing...\n• Thành thạo Google Ads, SEO.",
            "benefits": "• Thu nhập 40 - 60 triệu VND...\n• ESOP và du lịch châu Âu.",
            "suggested_skills": [
                "Digital Marketing",
                "SEO Strategy",
                "Google Ads",
                "B2B Marketing",
            ],
            "salary_min": 40000000,
            "salary_max": 60000000,
        }

        import json

        mock_create = AsyncMock(
            return_value={"choices": [{"message": {"content": json.dumps(mock_content)}}]}
        )
        monkeypatch.setattr(deepseek_client, "create_chat_completion", mock_create)

        headers = _register_and_login_employer(
            client, db_session, email="hr_mkt@techcorp.com", company_name="TechCorp Asia"
        )

        resp = client.post(
            "/ai/generate-jd",
            json={
                "job_title": "Trưởng phòng Digital Marketing",
                "industry": "Marketing & Truyền thông",
                "experience_level": "lead",
                "job_type": "full_time",
                "tone": "modern_startup",
            },
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert data["title"] == "Trưởng phòng Digital Marketing B2B"
        assert data["salary_min"] == 40000000
        assert data["salary_max"] == 60000000
        assert "Digital Marketing" in data["suggested_skills"]
        assert mock_create.called
