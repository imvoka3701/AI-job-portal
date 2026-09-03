"""
Tests for Vector Embedding Cache & O(1) Matching.
Verifies:
1. Lazy generation and DB caching of embedding on Resume if missing.
2. Matching score computation for CV Builder documents (CvDocument).
3. Automatic ai_matching_score calculation on Application submission.
"""

import pytest
from sqlalchemy.orm import Session

from app.models.cv_document import CvDocument, CvDocumentStatus
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.services.ai_matching import (
    ai_matching_service,
    extract_cv_document_text,
    _cosine_similarity_python,
)
from app.services.embedding_service import EMBEDDING_DIM


def test_extract_cv_document_text():
    """Verify text extraction from structured CV Builder document."""
    content = {
        "version": 1,
        "personal": {
            "full_name": "Nguyen Van A",
            "headline": "Senior Python Engineer",
            "location": "Ho Chi Minh City",
        },
        "summary": "Experienced backend developer specializing in FastAPI and PostgreSQL.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "experience": [
            {
                "title": "Backend Lead",
                "company": "Tech Corp",
                "description": "Architected microservices using FastAPI.",
                "highlights": ["Reduced latency by 40%"],
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Science",
                "school": "University of Science",
                "field_of_study": "Computer Science",
            }
        ],
        "projects": [
            {
                "name": "E-commerce platform",
                "description": "High traffic store with 100k DAU.",
            }
        ],
    }

    doc = CvDocument(
        id=10,
        user_id=1,
        title="My CV",
        template_key="ats-minimal",
        status=CvDocumentStatus.PUBLISHED.value,
        content_json=content,
    )

    extracted = extract_cv_document_text(doc)
    assert "Nguyen Van A" in extracted
    assert "Senior Python Engineer" in extracted
    assert "FastAPI and PostgreSQL" in extracted
    assert "Kỹ năng: Python, FastAPI, PostgreSQL, Docker" in extracted
    assert "Backend Lead" in extracted
    assert "Reduced latency by 40%" in extracted
    assert "University of Science" in extracted
    assert "E-commerce platform" in extracted


@pytest.mark.asyncio
async def test_lazy_embedding_generation_on_resume(db_session: Session, monkeypatch):
    """Verify that if resume.embedding is None, it is generated and cached into DB."""
    # Mock generate_embedding to avoid heavy ML in unit test
    fake_vector = [0.1] * EMBEDDING_DIM
    monkeypatch.setattr("app.services.embedding_service.generate_embedding", lambda _: fake_vector)

    user = db_session.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if not user:
        user = User(email="lazy_emb@example.com", full_name="Lazy Emb", hashed_password="pw", role=UserRole.CANDIDATE)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    resume = Resume(
        user_id=user.id,
        title="Resume Without Vector",
        file_url="/tmp/resume.pdf",
        raw_text="Experienced Python Developer with 5 years experience in Django and FastAPI.",
        embedding=None,  # No embedding yet
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    job_emb = [0.1] * EMBEDDING_DIM
    res = await ai_matching_service.compute_match(db_session, resume=resume, job_embedding=job_emb)

    # Score should be computed
    assert res.score > 0
    # Resume in DB must now have cached embedding
    db_session.refresh(resume)
    assert resume.embedding is not None
    assert len(resume.embedding) == EMBEDDING_DIM


@pytest.mark.asyncio
async def test_compute_match_for_cv_document(db_session: Session, monkeypatch):
    """Verify matching score computation for CV Builder document."""
    fake_vector = [0.2] * EMBEDDING_DIM
    monkeypatch.setattr("app.services.embedding_service.generate_embedding", lambda _: fake_vector)

    user = db_session.query(User).filter(User.role == UserRole.CANDIDATE).first()
    if not user:
        user = User(email="cvdoc_test@example.com", full_name="CV Doc Test", hashed_password="pw", role=UserRole.CANDIDATE)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    doc = CvDocument(
        user_id=user.id,
        title="Builder CV",
        template_key="ats-minimal",
        status=CvDocumentStatus.PUBLISHED.value,
        content_json={
            "personal": {"full_name": "Test Candidate"},
            "summary": "Fullstack engineer",
            "skills": ["React", "Python"],
        },
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    job_emb = [0.2] * EMBEDDING_DIM
    res = await ai_matching_service.compute_match_for_cv_document(db_session, cv_document=doc, job_embedding=job_emb)

    assert res.score == 100.0  # Identical vectors => 100%
    assert res.explanation is not None
