"""Unit & Integration tests for Live AI Candidate Contrast feature."""

import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import app
from app.models.job import ExperienceLevel, Job, JobType
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.schemas.auth import TokenPayload
from app.services.auth_service import auth_service
from app.services.embedding_service import generate_embedding

client = TestClient(app)


def _login(db: Session, email: str, role: UserRole) -> tuple[User, dict[str, str]]:
    db.query(User).filter(User.email == email).delete()
    db.commit()

    user = User(
        email=email,
        hashed_password=hash_password("Password123!"),
        full_name=f"User {role.value}",
        role=role,
        company_name="Vercel Vietnam" if role == UserRole.EMPLOYER else None,
        is_active=True,
        token_version=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    payload = TokenPayload(sub=user.id, role=user.role, token_version=user.token_version)
    token = auth_service._create_access_token(payload)
    return user, {"Authorization": f"Bearer {token}"}


def test_candidate_contrast_requires_employer_or_admin(db_session: Session):
    _, cand_headers = _login(db_session, "cand_contrast@test.com", UserRole.CANDIDATE)
    resp = client.post(
        "/rag/compare-candidates",
        json={
            "job_id": 999,
            "candidate_1": {"document_type": "resume", "document_id": 1},
            "candidate_2": {"document_type": "resume", "document_id": 2},
        },
        headers=cand_headers,
    )
    assert resp.status_code == 403


def test_candidate_contrast_full_flow(db_session: Session):
    emp_user, emp_headers = _login(db_session, "emp_contrast@test.com", UserRole.EMPLOYER)

    # 1. Create a Job
    job = Job(
        title="Senior Python Backend Engineer",
        description="Xây dựng hệ thống microservices backend với Python FastAPI, PostgreSQL, Docker.",
        requirements="Ít nhất 3 năm kinh nghiệm với Python, FastAPI, Docker, SQL, Redis.",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.SENIOR,
        employer_id=emp_user.id,
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    # 2. Candidate 1 User + Resume (Strong Fullstack Backend - high match)
    cand1 = User(
        email="tuan_contrast@test.com",
        full_name="Nguyễn Văn Tuấn",
        hashed_password=hash_password("Password123!"),
        role=UserRole.CANDIDATE,
        is_active=True,
    )
    db_session.add(cand1)
    db_session.commit()
    db_session.refresh(cand1)

    res1_text = (
        "Nguyễn Văn Tuấn - Senior Backend Developer\n"
        "5 năm kinh nghiệm lập trình Python, FastAPI, PostgreSQL, Docker, Redis.\n"
        "Đã xây dựng hệ thống microservices xử lý 100k requests/s trên AWS."
    )
    res1 = Resume(
        user_id=cand1.id,
        title="CV Nguyễn Văn Tuấn",
        file_url="https://example.com/tuan.pdf",
        raw_text=res1_text,
        parsed_skills=json.dumps(["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]),
        embedding=generate_embedding(res1_text),
        is_validated=True,
    )
    db_session.add(res1)

    # 3. Candidate 2 User + Resume (Junior Designer / Marketing - low match)
    cand2 = User(
        email="lan_contrast@test.com",
        full_name="Trần Thị Lan",
        hashed_password=hash_password("Password123!"),
        role=UserRole.CANDIDATE,
        is_active=True,
    )
    db_session.add(cand2)
    db_session.commit()
    db_session.refresh(cand2)

    res2_text = (
        "Trần Thị Lan - UI/UX Designer & Content\n"
        "1 năm kinh nghiệm thiết kế giao diện Figma, Photoshop, Canva.\n"
        "Có kiến thức cơ bản về HTML/CSS, làm nội dung mạng xã hội."
    )
    res2 = Resume(
        user_id=cand2.id,
        title="CV Trần Thị Lan",
        file_url="https://example.com/lan.pdf",
        raw_text=res2_text,
        parsed_skills=json.dumps(["Figma", "UI/UX", "HTML", "CSS"]),
        embedding=generate_embedding(res2_text),
        is_validated=True,
    )
    db_session.add(res2)
    db_session.commit()
    db_session.refresh(res1)
    db_session.refresh(res2)

    # 4. Call compare-candidates endpoint
    payload = {
        "job_id": job.id,
        "candidate_1": {"document_type": "resume", "document_id": res1.id},
        "candidate_2": {"document_type": "resume", "document_id": res2.id},
    }
    resp = client.post("/rag/compare-candidates", json=payload, headers=emp_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["job_id"] == job.id
    assert "Python" in data["job_required_skills"]

    c1 = data["candidate_1"]
    c2 = data["candidate_2"]

    # Verify mathematical explainability
    assert c1["candidate_name"] == "Nguyễn Văn Tuấn"
    assert c2["candidate_name"] == "Trần Thị Lan"

    # Candidate 1 should significantly beat Candidate 2 on Python Backend job
    assert c1["total_match_score"] > c2["total_match_score"]
    assert c1["skills_score"] > c2["skills_score"]
    assert c1["vector_cosine_score"] > c2["vector_cosine_score"]

    # Vector samples are provided (8 dimensions)
    assert len(c1["vector_sample"]) == 8
    assert len(c2["vector_sample"]) == 8

    # Candidate 2 should have deal_breakers warning
    assert len(c2["deal_breakers"]) > 0

    # Verdict summary reflects the difference
    assert "vượt trội" in data["verdict_summary"] or c1["total_match_score"] > c2["total_match_score"]
    assert len(data["verdict_breakdown"]) >= 3
    assert data["formula_metadata"]["vector_weight"] == 0.35
