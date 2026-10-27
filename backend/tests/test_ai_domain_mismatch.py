"""Unit and integration tests for Smart Domain Guard (Domain Mismatch Detection).

Validates:
1. Industry bridge suggestions mapping for non-IT / cross-disciplinary profiles.
2. Threshold filtering with MIN_RECOMMEND_SIMILARITY = 0.40.
3. Polite notice and bridge recommendations when candidate domain has no active matching jobs.
4. Soft warning when match score is marginal (40-60%) or cross-domain.
5. Deep rubric analysis domain warning & deal breaker insertion when domain score < 35%.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.orm import Session

from app.models.cv_document import CvDocument, CvDocumentStatus
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.schemas.ai import DomainNotice
from app.services.ai_matching import (
    DEFAULT_BRIDGE_SUGGESTIONS,
    MIN_RECOMMEND_SIMILARITY,
    ai_matching_service,
    get_bridge_suggestions_for_industry,
)


def test_get_bridge_suggestions_for_industry():
    """Verify dictionary lookup and fallback behavior for various candidate backgrounds."""
    # Known domains
    ke_toan = get_bridge_suggestions_for_industry("Kế toán doanh nghiệp")
    assert any("ERP" in s for s in ke_toan)
    assert any("Fintech" in s for s in ke_toan)

    mkt = get_bridge_suggestions_for_industry("Digital Marketing & SEO")
    assert any("MarTech" in s or "Growth" in s for s in mkt)

    y_te = get_bridge_suggestions_for_industry("Điều dưỡng y tế")
    assert any("HealthTech" in s for s in y_te)

    nhung = get_bridge_suggestions_for_industry("Lập trình nhúng vi điều khiển")
    assert any("IoT" in s or "Firmware" in s for s in nhung)

    # Unknown domain or None
    assert get_bridge_suggestions_for_industry("Nghệ thuật ẩm thực") == DEFAULT_BRIDGE_SUGGESTIONS
    assert get_bridge_suggestions_for_industry(None) == DEFAULT_BRIDGE_SUGGESTIONS
    assert get_bridge_suggestions_for_industry("") == DEFAULT_BRIDGE_SUGGESTIONS


@pytest.mark.asyncio
async def test_recommend_jobs_unsupported_domain_filtered(db_session: Session):
    """Verify that candidate with non-IT domain (Accounting) where all jobs have similarity < 0.40

    receives total_matched=0 and a structured polite DomainNotice with bridge suggestions.
    """
    user = db_session.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if not user:
        user = User(
            email="accountant_test@example.com",
            full_name="Le Thi Ke Toan",
            hashed_password="pw",
            role=UserRole.CANDIDATE,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    resume = Resume(
        user_id=user.id,
        title="CV Kế toán trưởng",
        raw_text="5 năm kinh nghiệm kế toán thuế, quyết toán tài chính, phần mềm MISA.",
        parsed_industry="Kế toán",
        parsed_key_skills=json.dumps(["Kế toán thuế", "MISA", "Báo cáo tài chính"]),
        embedding=[0.05] * 384,
        is_validated=True,
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    # Mock find_top_matching_jobs returning only low similarity tech jobs (< 0.40)
    low_sim_jobs = [
        {
            "job_id": 101,
            "title": "Senior Frontend ReactJS",
            "company_id": None,
            "location": "Hà Nội",
            "experience_level": "Senior",
            "similarity": 0.28,
            "category_id": 999,
        },
        {
            "job_id": 102,
            "title": "DevOps Engineer (Kubernetes)",
            "company_id": None,
            "location": "TP.HCM",
            "experience_level": "Middle",
            "similarity": 0.32,
            "category_id": 999,
        },
    ]

    with patch.object(
        ai_matching_service, "find_top_matching_jobs", new=AsyncMock(return_value=low_sim_jobs)
    ):
        result = await ai_matching_service.recommend_jobs_for_resume(
            db_session, resume=resume, limit=10
        )

    # Below MIN_RECOMMEND_SIMILARITY => filtered out
    assert result["total_matched"] == 0
    assert result["recommendations"] == []
    assert result["domain_notice"] is not None

    notice = DomainNotice(**result["domain_notice"])
    assert notice.is_unsupported_domain is True
    assert notice.detected_industry == "Kế toán"
    assert "ngưỡng phù hợp tối thiểu 40%" in notice.message
    assert len(notice.bridge_suggestions) >= 2
    assert any("ERP" in s for s in notice.bridge_suggestions)


@pytest.mark.asyncio
async def test_recommend_jobs_marginal_cross_domain_warning(db_session: Session):
    """Verify that when jobs meet threshold (>= 0.40) but are cross-domain or marginal (< 60%),

    a soft DomainNotice is attached.
    """
    user = db_session.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if not user:
        user = User(
            email="mkt_candidate@example.com",
            full_name="Tran Marketing",
            hashed_password="pw",
            role=UserRole.CANDIDATE,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    resume = Resume(
        user_id=user.id,
        title="CV Chuyên viên Marketing",
        raw_text="3 năm kinh nghiệm Digital Marketing, Google Ads, SEO, Social Media.",
        parsed_industry="Marketing",
        parsed_key_skills=json.dumps(["SEO", "Google Ads", "Content"]),
        embedding=[0.1] * 384,
        industry_category_id=1,  # Marketing category
        is_validated=True,
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    # Job passes 40% but is cross-category (Tech category 2 != resume category 1)
    marginal_jobs = [
        {
            "job_id": 201,
            "title": "Chuyên viên Tối ưu Hóa Chuyển đổi Sản phẩm (Growth)",
            "company_id": None,
            "location": "Hà Nội",
            "experience_level": "Middle",
            "similarity": 0.48,
            "category_id": 2,  # Different category
        }
    ]

    with patch.object(
        ai_matching_service, "find_top_matching_jobs", new=AsyncMock(return_value=marginal_jobs)
    ):
        result = await ai_matching_service.recommend_jobs_for_resume(
            db_session, resume=resume, limit=10
        )

    assert result["total_matched"] == 1
    rec = result["recommendations"][0]
    assert rec["match_score"] == 48.0
    assert result["domain_notice"] is not None

    notice = DomainNotice(**result["domain_notice"])
    assert notice.is_unsupported_domain is False
    assert "giao thoa kỹ năng" in notice.message
    assert any("MarTech" in s or "Growth" in s for s in notice.bridge_suggestions)


@pytest.mark.asyncio
async def test_recommend_jobs_for_cv_document_domain_guard(db_session: Session):
    """Verify smart guard behavior for CV Builder documents."""
    user = db_session.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if not user:
        user = User(
            email="cv_builder_user@example.com",
            full_name="CV Builder User",
            hashed_password="pw",
            role=UserRole.CANDIDATE,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    # Empty CV doc
    empty_doc = CvDocument(
        user_id=user.id,
        title="Empty CV",
        template_key="modern",
        status=CvDocumentStatus.DRAFT.value,
        content_json={},
    )
    db_session.add(empty_doc)
    db_session.commit()
    db_session.refresh(empty_doc)

    res_empty = await ai_matching_service.recommend_jobs_for_cv_document(
        db_session, cv_document=empty_doc
    )
    assert res_empty["total_matched"] == 0
    assert res_empty["domain_notice"]["is_unsupported_domain"] is True

    # Populated CV doc with low similarity jobs
    filled_doc = CvDocument(
        user_id=user.id,
        title="Graphic Designer CV",
        template_key="modern",
        status=CvDocumentStatus.PUBLISHED.value,
        content_json={
            "personal": {"full_name": "Nguyen Designer"},
            "summary": "Graphic designer with Photoshop and Illustrator expertise.",
            "skills": ["Photoshop", "Illustrator", "Branding"],
        },
    )
    db_session.add(filled_doc)
    db_session.commit()
    db_session.refresh(filled_doc)

    with patch("app.services.embedding_service.generate_embedding", return_value=[0.05] * 384):
        with patch.object(
            ai_matching_service,
            "find_top_matching_jobs",
            new=AsyncMock(
                return_value=[
                    {
                        "job_id": 301,
                        "title": "Backend Golang Engineer",
                        "company_id": None,
                        "location": "Đà Nẵng",
                        "experience_level": "Senior",
                        "similarity": 0.22,
                        "category_id": 1,
                    }
                ]
            ),
        ):
            res_filled = await ai_matching_service.recommend_jobs_for_cv_document(
                db_session, cv_document=filled_doc
            )

    assert res_filled["total_matched"] == 0
    assert res_filled["domain_notice"]["is_unsupported_domain"] is True
    assert (
        f"{int(MIN_RECOMMEND_SIMILARITY * 100)}%"
        in res_filled["domain_notice"]["message"]
    )


@pytest.mark.asyncio
async def test_deep_rubric_analysis_domain_mismatch_warning():
    """Verify that _run_deep_rubric_analysis flags low domain score (< 35%)

    as domain_mismatch_warning and appends to deal_breakers.
    """
    from types import SimpleNamespace

    mock_llm_json = {
        "domain_score": 20.0,  # Far mismatch (e.g., Accountant vs Senior Cloud Architect)
        "skills_score": 15.0,
        "experience_score": 50.0,
        "strengths": ["Có kinh nghiệm làm việc văn phòng"],
        "weaknesses": ["Hoàn toàn không có kỹ năng Cloud, AWS, Kubernetes"],
        "deal_breakers": ["Thiếu chứng chỉ và kinh nghiệm Cloud bắt buộc"],
        "interview_questions": ["Bạn có định hướng học thêm về điện toán đám mây không?"],
    }

    mock_job = SimpleNamespace(
        title="Senior Cloud Architect",
        experience_level="Senior",
        job_type="Full-time",
        location="Hà Nội",
        requirements="Yêu cầu tối thiểu 5 năm thiết kế hệ thống AWS/GCP, Kubernetes, Terraform",
        description="Kiến trúc sư đám mây cho hệ sinh thái Microservices",
    )

    with patch(
        "app.services.ai_matching.deepseek_client.create_chat_completion",
        new=AsyncMock(return_value={"choices": [{"message": {"content": json.dumps(mock_llm_json)}}]}),
    ):
        result = await ai_matching_service._run_deep_rubric_analysis(
            resume_text="CV Kế toán trưởng 10 năm kinh nghiệm sổ sách chứng từ",
            job=mock_job,
            base_cosine_score=25.0,
            vector_sample=[],
        )

    assert result.domain_mismatch_warning is not None
    assert "sự khác biệt lớn về chuyên môn" in result.domain_mismatch_warning
    assert any("khác biệt đáng kể" in db for db in result.deal_breakers)
    assert result.score < 35.0

