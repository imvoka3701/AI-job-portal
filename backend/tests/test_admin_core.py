"""Admin core: management guardrails, moderation, and immutable audit trail."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.application import Application
from app.models.job import ExperienceLevel, Job, JobType
from app.models.user import User, UserRole


def _create_user(
    db: Session,
    *,
    email: str,
    role: UserRole,
    is_active: bool = True,
    full_name: str = "Test User",
    company_name: str | None = None,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password("secret123"),
        full_name=full_name,
        role=role,
        is_active=is_active,
        company_name=company_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"email": email, "password": "secret123"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _admin(client: TestClient, db: Session) -> tuple[User, dict[str, str]]:
    user = _create_user(
        db,
        email="admin-core@example.com",
        role=UserRole.ADMIN,
        full_name="Core Admin",
    )
    return user, _login(client, user.email)


def test_admin_user_search_status_guard_and_audit(client: TestClient, db_session: Session):
    admin, headers = _admin(client, db_session)
    candidate = _create_user(
        db_session,
        email="candidate-search@example.com",
        role=UserRole.CANDIDATE,
        full_name="Nguyen Candidate",
    )

    listed = client.get(
        "/admin/users",
        headers=headers,
        params={"keyword": "Nguyen", "role": "candidate", "is_active": True},
    )
    assert listed.status_code == 200, listed.text
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["id"] == candidate.id

    blocked = client.patch(
        f"/admin/users/{admin.id}/status",
        headers=headers,
        json={"is_active": False},
    )
    assert blocked.status_code == 400
    assert "không thể tự khóa" in blocked.json()["detail"]

    deactivated = client.patch(
        f"/admin/users/{candidate.id}/status",
        headers=headers,
        json={"is_active": False},
    )
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False

    logs = client.get(
        "/admin/audit-logs",
        headers=headers,
        params={"action": "user.deactivated"},
    )
    assert logs.status_code == 200, logs.text
    assert logs.json()["total"] == 1
    assert logs.json()["items"][0]["actor_email"] == admin.email
    assert logs.json()["items"][0]["target_id"] == str(candidate.id)


def test_company_approval_and_search_are_audited(client: TestClient, db_session: Session):
    _, headers = _admin(client, db_session)
    employer = _create_user(
        db_session,
        email="owner@audit-company.test",
        role=UserRole.EMPLOYER,
        is_active=False,
        full_name="Audit Owner",
        company_name="Audit Company",
    )

    companies = client.get(
        "/admin/companies",
        headers=headers,
        params={"keyword": "Audit Company", "is_active": False},
    )
    assert companies.status_code == 200
    assert [item["id"] for item in companies.json()] == [employer.id]

    approved = client.patch(f"/admin/companies/{employer.id}/approve", headers=headers)
    assert approved.status_code == 200, approved.text
    assert approved.json()["is_active"] is True

    logs = client.get(
        "/admin/audit-logs",
        headers=headers,
        params={"target_type": "company", "page_size": 1},
    ).json()
    assert logs["total"] == 1
    assert logs["items"][0]["action"] == "company.approved"
    assert logs["items"][0]["target_label"] == "Audit Company"


def test_job_moderation_preserves_application_and_is_audited(
    client: TestClient,
    db_session: Session,
):
    _, headers = _admin(client, db_session)
    employer = _create_user(
        db_session,
        email="job-owner@example.com",
        role=UserRole.EMPLOYER,
        company_name="Job Owner Co",
    )
    candidate = _create_user(
        db_session,
        email="job-candidate@example.com",
        role=UserRole.CANDIDATE,
    )
    job = Job(
        title="Backend Audit Job",
        description="Backend role",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.MIDDLE,
        employer_id=employer.id,
        is_active=True,
    )
    db_session.add(job)
    db_session.flush()
    application = Application(candidate_id=candidate.id, job_id=job.id)
    db_session.add(application)
    db_session.commit()

    closed = client.patch(
        f"/admin/jobs/{job.id}/status",
        headers=headers,
        json={"is_active": False},
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["is_active"] is False
    assert db_session.get(Application, application.id) is not None

    filtered = client.get(
        "/admin/jobs",
        headers=headers,
        params={"keyword": "Job Owner Co", "is_active": False},
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1

    reopened = client.patch(
        f"/admin/jobs/{job.id}/status",
        headers=headers,
        json={"is_active": True},
    )
    assert reopened.status_code == 200

    logs = client.get(
        "/admin/audit-logs",
        headers=headers,
        params={"target_type": "job", "page_size": 1},
    ).json()
    assert logs["total"] == 2
    assert logs["items"][0]["action"] == "job.activated"


def test_audit_logs_are_admin_only(client: TestClient, db_session: Session):
    _, admin_headers = _admin(client, db_session)
    candidate = _create_user(
        db_session,
        email="audit-forbidden@example.com",
        role=UserRole.CANDIDATE,
    )
    candidate_headers = _login(client, candidate.email)

    assert client.get("/admin/audit-logs", headers=candidate_headers).status_code == 403
    assert client.get("/admin/audit-logs", headers=admin_headers).status_code == 200
