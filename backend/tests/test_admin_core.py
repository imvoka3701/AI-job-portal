"""Admin core: management guardrails, moderation, and immutable audit trail."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin_rbac import AdminRole
from app.models.application import Application
from app.models.document_chunk import DocumentChunk
from app.models.job import ExperienceLevel, Job, JobType
from app.models.resume import EMBEDDING_DIM
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
    super_role = db.query(AdminRole).filter(AdminRole.code == "super_admin").first()
    if not super_role:
        super_role = AdminRole(code="super_admin", name="Super Admin", is_system=True)
        db.add(super_role)
        db.commit()
        db.refresh(super_role)
    user = _create_user(
        db,
        email="admin-core@example.com",
        role=UserRole.ADMIN,
        full_name="Core Admin",
    )
    user.admin_role_id = super_role.id
    db.commit()
    db.refresh(user)
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
    assert "không thể tự khóa" in blocked.json()["error"]["message"]

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


def test_company_verify_toggle_and_audit(client: TestClient, db_session: Session):
    admin, headers = _admin(client, db_session)
    employer = _create_user(
        db_session,
        email="verify-employer@example.com",
        role=UserRole.EMPLOYER,
        full_name="Tech Corp Owner",
        company_name="Tech Corp Vietnam",
    )

    # Initial check - not verified
    companies = client.get("/admin/companies", headers=headers).json()
    matched = [c for c in companies if c["id"] == employer.id]
    assert len(matched) == 1
    assert matched[0]["is_verified"] is False

    # Toggle verify -> True
    verify_resp = client.patch(
        f"/admin/companies/{employer.id}/verify",
        headers=headers,
        json={"is_verified": True},
    )
    assert verify_resp.status_code == 200, verify_resp.text
    assert verify_resp.json()["is_verified"] is True

    # Audit log check
    logs = client.get(
        "/admin/audit-logs",
        headers=headers,
        params={"action": "company.verified"},
    ).json()
    assert logs["total"] >= 1
    assert logs["items"][0]["target_id"] == str(employer.id)

    # Toggle verify -> False (revoke)
    revoke_resp = client.patch(
        f"/admin/companies/{employer.id}/verify",
        headers=headers,
        json={"is_verified": False},
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["is_verified"] is False


def test_non_super_admin_cannot_deactivate_super_admin(client: TestClient, db_session: Session):
    """Hierarchy Defense: A moderator or non-super admin cannot deactivate a Super Admin."""
    super_admin, _ = _admin(client, db_session)

    # 1. Create a non-super admin role (moderator)
    mod_role = db_session.query(AdminRole).filter(AdminRole.code == "compliance_mod").first()
    if not mod_role:
        mod_role = AdminRole(code="compliance_mod", name="Compliance Moderator", is_system=False)
        db_session.add(mod_role)
        db_session.commit()
        db_session.refresh(mod_role)

    mod_user = _create_user(
        db_session,
        email="mod-attacker@example.com",
        role=UserRole.ADMIN,
        full_name="Mod Attacker",
    )
    mod_user.admin_role_id = mod_role.id
    db_session.commit()
    mod_headers = _login(client, mod_user.email)

    # 2. Mod attempts to deactivate the Super Admin
    res_attack = client.patch(
        f"/admin/users/{super_admin.id}/status",
        headers=mod_headers,
        json={"is_active": False},
    )
    assert res_attack.status_code == 403
    assert "Chỉ Quản trị viên Tối cao" in res_attack.json()["error"]["message"]


def test_deactivating_company_suspends_jobs_and_invalidates_tokens(client: TestClient, db_session: Session):
    """Company deactivation cascade: Automatically suspends active jobs and bumps token_version."""
    admin, headers = _admin(client, db_session)

    # 1. Create employer with an active job
    employer = _create_user(
        db_session,
        email="banned-employer@example.com",
        role=UserRole.EMPLOYER,
        full_name="Banned Employer",
        company_name="Banned Corp",
    )
    job = Job(
        title="Spam Senior Job",
        description="Spam description",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.SENIOR,
        location="Hà Nội",
        employer_id=employer.id,
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    assert job.is_active is True

    # 2. Admin rejects/deactivates company
    res_deactivate = client.patch(f"/admin/companies/{employer.id}/reject", headers=headers)
    assert res_deactivate.status_code == 200

    # 3. Verify employer token bumped and job suspended
    db_session.refresh(employer)
    db_session.refresh(job)
    assert employer.is_active is False
    assert employer.token_version >= 2
    assert job.is_active is False


def test_deleting_job_cleans_up_document_chunks(client: TestClient, db_session: Session):
    """Vector hygiene: Deleting a job removes polymorphic document_chunks from pgvector."""
    admin, headers = _admin(client, db_session)

    employer = _create_user(
        db_session,
        email="vector-cleanup-emp@example.com",
        role=UserRole.EMPLOYER,
        full_name="Vector Employer",
    )
    job = Job(
        title="AI Engineer Job",
        description="RAG Vectorized Job",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.SENIOR,
        location="Đà Nẵng",
        employer_id=employer.id,
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    # Create dummy vector chunk for this job
    chunk = DocumentChunk(
        document_type="job",
        document_id=job.id,
        section_type="general",
        chunk_index=0,
        content="AI Engineer job content",
        embedding=[0.01] * EMBEDDING_DIM,
    )
    db_session.add(chunk)
    db_session.commit()

    # Verify chunk exists
    existing = db_session.query(DocumentChunk).filter(
        DocumentChunk.document_type == "job",
        DocumentChunk.document_id == job.id,
    ).count()
    assert existing == 1

    # Admin permanently deletes job
    del_res = client.delete(f"/admin/jobs/{job.id}", headers=headers)
    assert del_res.status_code == 204

    # Verify chunk was cleaned up
    remaining = db_session.query(DocumentChunk).filter(
        DocumentChunk.document_type == "job",
        DocumentChunk.document_id == job.id,
    ).count()
    assert remaining == 0

