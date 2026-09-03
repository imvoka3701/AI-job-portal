"""Tests for Admin Interview Oversight and System Alerts."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin_audit_log import AdminAuditLog
from app.models.application import Application
from app.models.interview_round import InterviewRound, RoundStatus, RoundType
from app.models.job import ExperienceLevel, Job, JobType
from app.models.user import User, UserRole


def _create_admin_and_login(client: TestClient, db_session: Session) -> dict[str, str]:
    admin = User(
        email="admin_interview@test.com",
        hashed_password=hash_password("Password123!"),
        full_name="Super Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    resp = client.post(
        "/auth/login", json={"email": "admin_interview@test.com", "password": "Password123!"}
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _setup_recruitment_data(
    db_session: Session,
) -> tuple[User, User, Job, Application, InterviewRound]:
    employer = User(
        email="employer_io@test.com",
        hashed_password="hashed_pwd",
        full_name="Tech Recruiter",
        company_name="TechCorp",
        role=UserRole.EMPLOYER,
        is_active=True,
    )
    candidate = User(
        email="candidate_io@test.com",
        hashed_password="hashed_pwd",
        full_name="Nguyen Van A",
        role=UserRole.CANDIDATE,
        is_active=True,
    )
    db_session.add_all([employer, candidate])
    db_session.commit()

    job = Job(
        title="Senior Python Engineer",
        description="Build scalable FastAPI services",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.SENIOR,
        location="Ho Chi Minh City",
        is_active=True,
        employer_id=employer.id,
    )
    db_session.add(job)
    db_session.commit()

    app = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="pending",
    )
    db_session.add(app)
    db_session.commit()

    round_obj = InterviewRound(
        application_id=app.id,
        round_number=1,
        round_type=RoundType.TECH_INTERVIEW.value,
        round_name="Technical Coding",
        status=RoundStatus.PENDING.value,
        notes="Candidate showed good FastAPI knowledge",
    )
    db_session.add(round_obj)
    db_session.commit()
    db_session.refresh(round_obj)

    return employer, candidate, job, app, round_obj


class TestAdminInterviewOversight:
    def test_admin_list_interview_rounds(self, client: TestClient, db_session: Session):
        headers = _create_admin_and_login(client, db_session)
        _, candidate, job, _, round_obj = _setup_recruitment_data(db_session)

        resp = client.get("/admin/interview-rounds", headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["total"] >= 1
        items = data["items"]
        matching = next((item for item in items if item["id"] == round_obj.id), None)
        assert matching is not None
        assert matching["candidate_name"] == candidate.full_name
        assert matching["job_title"] == job.title
        assert matching["company_name"] == "TechCorp"
        assert matching["needs_review"] is False

    def test_filter_interview_rounds(self, client: TestClient, db_session: Session):
        headers = _create_admin_and_login(client, db_session)
        _, _, _, _, round_obj = _setup_recruitment_data(db_session)

        # Filter by result
        resp_pending = client.get("/admin/interview-rounds?result=pending", headers=headers)
        assert resp_pending.status_code == 200
        assert any(r["id"] == round_obj.id for r in resp_pending.json()["items"])

        resp_passed = client.get("/admin/interview-rounds?result=passed", headers=headers)
        assert resp_passed.status_code == 200
        assert not any(r["id"] == round_obj.id for r in resp_passed.json()["items"])

        # Filter by round_type
        resp_tech = client.get("/admin/interview-rounds?round_type=technical", headers=headers)
        assert resp_tech.status_code == 200
        assert any(r["id"] == round_obj.id for r in resp_tech.json()["items"])

    def test_mark_and_clear_review_with_audit_log(self, client: TestClient, db_session: Session):
        headers = _create_admin_and_login(client, db_session)
        _, _, _, _, round_obj = _setup_recruitment_data(db_session)

        # 1. Mark for review
        mark_resp = client.patch(
            f"/admin/interview-rounds/{round_obj.id}/mark-review",
            json={"needs_review": True, "review_reason": "Suspicious feedback quality"},
            headers=headers,
        )
        assert mark_resp.status_code == 200, mark_resp.text
        updated = mark_resp.json()
        assert updated["needs_review"] is True
        assert updated["review_reason"] == "Suspicious feedback quality"

        # Check DB audit log
        audit = (
            db_session.query(AdminAuditLog)
            .filter(
                AdminAuditLog.action == "interview_round.mark_review",
                AdminAuditLog.target_id == str(round_obj.id),
            )
            .first()
        )
        assert audit is not None
        assert audit.details_json["review_reason"] == "Suspicious feedback quality"

        # 2. Clear review
        clear_resp = client.patch(
            f"/admin/interview-rounds/{round_obj.id}/mark-review",
            json={"needs_review": False, "review_reason": None},
            headers=headers,
        )
        assert clear_resp.status_code == 200
        cleared = clear_resp.json()
        assert cleared["needs_review"] is False
        assert cleared["review_reason"] is None

        # Check clear audit log
        audit_clear = (
            db_session.query(AdminAuditLog)
            .filter(
                AdminAuditLog.action == "interview_round.clear_review",
                AdminAuditLog.target_id == str(round_obj.id),
            )
            .first()
        )
        assert audit_clear is not None

    def test_non_admin_forbidden(self, client: TestClient, db_session: Session):
        client.post(
            "/auth/register",
            json={
                "email": "candidate_unauth@test.com",
                "password": "Password123!",
                "full_name": "Unauthorized Candidate",
                "role": "candidate",
            },
        )
        login_resp = client.post(
            "/auth/login",
            json={
                "email": "candidate_unauth@test.com",
                "password": "Password123!",
            },
        )
        token = login_resp.json()["access_token"]
        cand_headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/admin/interview-rounds", headers=cand_headers)
        assert resp.status_code == 403

        resp_alerts = client.get("/admin/alerts", headers=cand_headers)
        assert resp_alerts.status_code == 403

    def test_admin_alerts_endpoint(self, client: TestClient, db_session: Session):
        headers = _create_admin_and_login(client, db_session)
        _setup_recruitment_data(db_session)

        resp = client.get("/admin/alerts", headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "ai_errors_24h" in data
        assert "stale_jobs" in data
        assert "overdue_interviews" in data
        assert "pending_actions" in data
