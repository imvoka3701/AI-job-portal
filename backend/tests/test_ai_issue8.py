"""Unit tests for Issue 8: AI Feature Integration & Tone/Prompt Support.

Tests:
1. Pydantic schema validation for tone, custom_prompt, and cv_document_id
2. EmailGeneratorService custom prompt and tone injection
3. /ai/evaluate with cv_document_id
4. /ai/roadmap with cv_document_id
5. /ai/recommend-jobs with cv_document_id
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.cv_document import crud_cv_document
from app.models.user import User
from app.schemas.ai import (
    CVEvaluationRequest,
    CVEvaluationResponse,
    GenerateEmailRequest,
    JobRecommendationResponse,
    RoadmapRequest,
    RoadmapResponse,
)
from app.schemas.cv_document import CvDocumentCreate
from app.services.email_generator import email_generator_service
from tests.test_ai import _register_and_login

# ─── 1. Schema Validation Tests ───────────────────────────────────────────────


def test_generate_email_schema_tone_and_prompt():
    req = GenerateEmailRequest(
        application_id=10,
        email_type="invite",
        tone="friendly",
        custom_prompt="Nhắc ứng viên mang theo laptop và CCCD",
    )
    assert req.tone == "friendly"
    assert req.custom_prompt == "Nhắc ứng viên mang theo laptop và CCCD"


def test_cv_evaluation_schema_cv_document_id():
    req = CVEvaluationRequest(cv_document_id=42)
    assert req.cv_document_id == 42
    assert req.resume_id is None

    with pytest.raises(ValueError, match="Cần cung cấp ít nhất"):
        CVEvaluationRequest()


def test_roadmap_schema_cv_document_id():
    req = RoadmapRequest(cv_document_id=42, target_role="Senior Fullstack")
    assert req.cv_document_id == 42
    assert req.target_role == "Senior Fullstack"

    with pytest.raises(ValueError, match="Cần cung cấp ít nhất"):
        RoadmapRequest(target_role="Senior Fullstack")


def test_job_recommendation_response_schema():
    resp = JobRecommendationResponse(
        cv_document_id=99,
        industry_detected="IT - Phần mềm",
        total_matched=1,
        recommendations=[
            {
                "job_id": 1,
                "title": "Backend Dev",
                "experience_level": "mid",
                "match_score": 85.0,
                "match_reason": "Kỹ năng Python phù hợp",
            }
        ],
    )
    assert resp.cv_document_id == 99
    assert resp.resume_id is None
    assert len(resp.recommendations) == 1


# ─── 2. Email Generator Service Test ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_email_generator_service_tone_and_custom_prompt():
    mock_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "subject": "[TechCorp] Thư mời phỏng vấn",
                        "body": "Chào bạn, trân trọng mời bạn tham gia...",
                    })
                }
            }
        ]
    }

    with patch.object(
        email_generator_service.client,
        "create_chat_completion",
        new=AsyncMock(return_value=mock_response),
    ) as mock_complete:
        res = await email_generator_service.generate(
            email_type="invite",
            candidate_name="Nguyễn Văn A",
            job_title="Senior Python Developer",
            company_name="TechCorp Vietnam",
            cv_summary="Có 4 năm kinh nghiệm FastAPI và PostgreSQL",
            tone="friendly",
            custom_prompt="Buổi phỏng vấn diễn ra online qua Google Meet lúc 15h00",
        )

        assert mock_complete.called
        call_kwargs = mock_complete.call_args[1]
        user_msg = call_kwargs["messages"][1]["content"]

        # Verify tone description is injected
        assert "Thân thiện, ấm áp, cởi mở" in user_msg
        # Verify custom prompt is injected
        assert "Buổi phỏng vấn diễn ra online qua Google Meet lúc 15h00" in user_msg
        assert "Nguyễn Văn A" in user_msg
        assert res.subject == "[TechCorp] Thư mời phỏng vấn"


# ─── 3. Endpoint Tests with CV Builder Document ───────────────────────────────


def test_evaluate_cv_document_endpoint(client: TestClient, db_session: Session):
    headers = _register_and_login(client, "cand_issue8_eval@example.com", "Password123!", role="candidate")
    user = db_session.query(User).filter(User.email == "cand_issue8_eval@example.com").first()
    assert user is not None

    # Create a CV document for candidate
    doc = crud_cv_document.create(
        db_session,
        data=CvDocumentCreate(
            title="CV Kỹ Sư Phần Mềm",
            template_key="modern-two-column",
            content_json={
                "personal": {"full_name": "Trần Văn B", "headline": "Software Engineer"},
                "summary": "Kỹ sư phần mềm đam mê công nghệ với 3 năm kinh nghiệm lập trình backend.",
                "skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
                "experience": [
                    {
                        "title": "Backend Engineer",
                        "company": "FPT Software",
                        "description": "Phát triển microservices với FastAPI",
                    }
                ],
            },
        ),
        user_id=user.id,
    )

    fake_eval = CVEvaluationResponse(
        overall_score=8.5,
        summary="CV rõ ràng, kỹ năng kỹ thuật tốt.",
        suggestions=["Bổ sung chứng chỉ điện toán đám mây"],
        skill_analysis={"Python": 9.0, "Docker": 8.0},
    )

    with patch("app.routers.ai.cv_evaluator_service.evaluate", new=AsyncMock(return_value=fake_eval)):
        resp = client.post(
            "/ai/evaluate",
            headers=headers,
            json={"cv_document_id": doc.id},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["overall_score"] == 8.5
        assert "Python" in data["skill_analysis"]


def test_roadmap_cv_document_endpoint(client: TestClient, db_session: Session):
    headers = _register_and_login(client, "cand_issue8_road@example.com", "Password123!", role="candidate")
    user = db_session.query(User).filter(User.email == "cand_issue8_road@example.com").first()
    assert user is not None

    doc = crud_cv_document.create(
        db_session,
        data=CvDocumentCreate(
            title="CV AI Engineer",
            template_key="modern-two-column",
            content_json={
                "personal": {"full_name": "Lê Văn C"},
                "summary": "Định hướng AI Engineer",
                "skills": ["Python", "PyTorch"],
            },
        ),
        user_id=user.id,
    )

    fake_roadmap = RoadmapResponse(
        target_role="Senior AI Engineer",
        current_level="Junior",
        estimated_months=6,
        steps=[
            {
                "order": 1,
                "title": "Học sâu và LLMs",
                "description": "Nghiên cứu Transformers và PyTorch",
                "skills_to_learn": ["Transformers", "LangChain"],
                "resources": ["deeplearning.ai"],
            }
        ],
    )

    with patch("app.routers.ai.roadmap_suggest_service.suggest", new=AsyncMock(return_value=fake_roadmap)):
        resp = client.post(
            "/ai/roadmap",
            headers=headers,
            json={"cv_document_id": doc.id, "target_role": "Senior AI Engineer"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_role"] == "Senior AI Engineer"
        assert len(data["steps"]) == 1


def test_recommend_jobs_cv_document_endpoint(client: TestClient, db_session: Session):
    headers = _register_and_login(client, "cand_issue8_rec@example.com", "Password123!", role="candidate")
    user = db_session.query(User).filter(User.email == "cand_issue8_rec@example.com").first()
    assert user is not None

    doc = crud_cv_document.create(
        db_session,
        data=CvDocumentCreate(
            title="CV Frontend",
            template_key="modern-two-column",
            content_json={
                "personal": {"full_name": "Phạm Thị D"},
                "summary": "Frontend developer với kinh nghiệm React và TypeScript",
                "skills": ["React", "TypeScript", "Tailwind CSS"],
            },
        ),
        user_id=user.id,
    )

    fake_rec = {
        "cv_document_id": doc.id,
        "industry_detected": "Tùy biến (CV Builder)",
        "total_matched": 1,
        "recommendations": [
            {
                "job_id": 10,
                "title": "React Frontend Developer",
                "company_name": "Startup Tech",
                "location": "Hà Nội",
                "experience_level": "mid",
                "match_score": 88.0,
                "match_reason": "Kỹ năng React và TypeScript phù hợp cao.",
            }
        ],
    }

    with patch(
        "app.routers.ai.ai_matching_service.recommend_jobs_for_cv_document",
        new=AsyncMock(return_value=fake_rec),
    ):
        resp = client.get(
            f"/ai/recommend-jobs?cv_document_id={doc.id}",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["cv_document_id"] == doc.id
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["match_score"] == 88.0
