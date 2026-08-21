"""End-to-End Business Flow Tests.

Validates the 6 core recruitment business flows from start to finish:
  Flow 1 — Candidate Apply
  Flow 2 — HR Recruitment Pipeline
  Flow 3 — Admin Oversight
  Flow 4 — Team Collaboration (Department Head)
  Flow 5 — CV Builder & AI Tools
  Flow 6 — Recruitment Request Workflow
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.crud.company import crud_company
from app.crud.resume import crud_resume
from app.crud.user import crud_user
from app.models.user import User, UserRole
from app.schemas.resume import ResumeCreate

PASSWORD = "StrongPass123!"

JOB_PAYLOAD = {
    "title": "Fullstack Developer",
    "description": "Build web apps with React and FastAPI.",
    "requirements": "TypeScript, Python, PostgreSQL, 2+ years",
    "benefits": "Remote, health insurance",
    "location": "TP. Hồ Chí Minh",
    "job_type": "full_time",
    "experience_level": "middle",
    "salary_min": 15000000,
    "salary_max": 35000000,
}


# ── Helpers ────────────────────────────────────────────────────────────────────


def _register_employer(
    client: TestClient,
    db: Session,
    *,
    email: str = "hr@techcorp.vn",
    company_name: str = "TechCorp VN",
) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "HR Manager",
            "role": "employer",
            "company_name": company_name,
        },
    )
    assert response.status_code == 201
    user = crud_user.get_by_email(db, email=email)
    assert user is not None
    membership = crud_company.get_active_membership(db, user_id=user.id)
    assert membership is not None
    user.is_active = True
    membership.company.is_active = True
    db.commit()
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _register_candidate(
    client: TestClient,
    *,
    email: str = "candidate@example.com",
) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Nguyễn Văn Ứng Viên",
            "role": "candidate",
        },
    )
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_admin(
    client: TestClient,
    db: Session,
    *,
    email: str = "admin@jobportal.vn",
) -> dict[str, str]:
    user = User(
        email=email,
        hashed_password=hash_password(PASSWORD),
        full_name="System Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_test_resume(db: Session, user_id: int) -> int:
    resume = crud_resume.create(
        db,
        obj_in=ResumeCreate(
            title="resume.pdf",
            file_url="uploads/test_resume.pdf",
            raw_text="Experienced Fullstack Developer with Python, React, FastAPI, PostgreSQL.",
            embedding=[0.05] * 384,
        ),
        user_id=user_id,
    )
    return resume.id


# ── Flow 1: Candidate Apply ───────────────────────────────────────────────────


class TestFlow1CandidateApply:
    """Flow: Register → Upload Resume → Browse Jobs → Apply → Check Status."""

    def test_full_candidate_apply_flow(self, client: TestClient, db_session: Session):
        # Step 1: Employer creates a job
        emp_headers = _register_employer(client, db_session)
        job_resp = client.post("/jobs", json=JOB_PAYLOAD, headers=emp_headers)
        assert job_resp.status_code == 201
        job_id = job_resp.json()["id"]

        # Step 2: Candidate registers
        cand_headers = _register_candidate(client)
        cand_user = crud_user.get_by_email(db_session, email="candidate@example.com")
        assert cand_user is not None

        # Step 3: Browse public jobs
        jobs_resp = client.get("/jobs")
        assert jobs_resp.status_code == 200
        assert jobs_resp.json()["total"] >= 1

        # Step 4: View specific job detail
        detail = client.get(f"/jobs/{job_id}")
        assert detail.status_code == 200
        assert detail.json()["title"] == JOB_PAYLOAD["title"]

        # Step 5: Candidate has resume
        resume_id = _create_test_resume(db_session, cand_user.id)

        # Step 6: Apply for the job
        apply_resp = client.post(
            "/applications",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=cand_headers,
        )
        assert apply_resp.status_code == 201
        app_data = apply_resp.json()
        assert app_data["status"] == "pending"
        assert app_data["job_id"] == job_id
        app_id = app_data["id"]

        # Step 7: Candidate checks their applications
        my_apps = client.get("/applications/me", headers=cand_headers)
        assert my_apps.status_code == 200
        assert any(a["id"] == app_id for a in my_apps.json())


# ── Flow 2: HR Recruitment Pipeline ───────────────────────────────────────────


class TestFlow2HRRecruitment:
    """Flow: Receive App → Review → Shortlist → Interview Round → Accept/Reject."""

    def test_full_hr_recruitment_pipeline(self, client: TestClient, db_session: Session):
        # Setup: Employer + Job + Candidate applies
        emp_headers = _register_employer(client, db_session)
        job = client.post("/jobs", json=JOB_PAYLOAD, headers=emp_headers)
        assert job.status_code == 201
        job_id = job.json()["id"]

        cand_headers = _register_candidate(client)
        cand_user = crud_user.get_by_email(db_session, email="candidate@example.com")
        assert cand_user is not None
        resume_id = _create_test_resume(db_session, cand_user.id)

        apply = client.post(
            "/applications",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=cand_headers,
        )
        assert apply.status_code == 201
        app_id = apply.json()["id"]

        # Step 1: HR reviews — changes status to "reviewed"
        update1 = client.patch(
            f"/applications/{app_id}",
            json={"status": "reviewed"},
            headers=emp_headers,
        )
        assert update1.status_code == 200
        assert update1.json()["status"] == "reviewed"

        # Step 2: Shortlist
        update2 = client.patch(
            f"/applications/{app_id}",
            json={"status": "shortlisted"},
            headers=emp_headers,
        )
        assert update2.json()["status"] == "shortlisted"

        # Step 3: Move to interview
        update3 = client.patch(
            f"/applications/{app_id}",
            json={"status": "interview"},
            headers=emp_headers,
        )
        assert update3.json()["status"] == "interview"

        # Step 4: Create an interview round
        round_resp = client.post(
            f"/applications/{app_id}/rounds",
            json={
                "round_type": "tech",
                "round_name": "Technical Interview",
                "scheduled_at": "2026-09-01T10:00:00+07:00",
                "location": "Google Meet",
            },
            headers=emp_headers,
        )
        assert round_resp.status_code == 201
        round_id = round_resp.json()["id"]

        # Step 5: Score criteria for this round via /rounds/{round_id}/criteria
        score_resp = client.put(
            f"/rounds/{round_id}/criteria",
            json={
                "criteria": [
                    {"criteria_name": "Problem Solving", "score": 9, "notes": "Excellent approach"}
                ]
            },
            headers=emp_headers,
        )
        assert score_resp.status_code == 200
        assert len(score_resp.json()) == 1

        # Step 6: Accept candidate
        update4 = client.patch(
            f"/applications/{app_id}",
            json={"status": "accepted", "decision_reason": "Strong technical skills"},
            headers=emp_headers,
        )
        assert update4.json()["status"] == "accepted"


# ── Flow 3: Admin Oversight ───────────────────────────────────────────────────


class TestFlow3AdminOversight:
    """Flow: Admin Dashboard → Stats → View Users → View Jobs → Audit Logs."""

    def test_admin_can_view_stats_and_manage(
        self, client: TestClient, db_session: Session
    ):
        # Setup: Create some data
        emp_headers = _register_employer(client, db_session, email="emp2@test.com")
        client.post("/jobs", json=JOB_PAYLOAD, headers=emp_headers)
        _register_candidate(client, email="cand2@test.com")
        admin_headers = _create_admin(client, db_session)

        # Step 1: Admin dashboard stats
        stats = client.get("/admin/stats", headers=admin_headers)
        assert stats.status_code == 200
        data = stats.json()
        assert "total_candidates" in data
        assert "total_employers" in data

        # Step 2: List all users
        users = client.get("/admin/users", headers=admin_headers)
        assert users.status_code == 200

        # Step 3: List all jobs
        jobs = client.get("/admin/jobs", headers=admin_headers)
        assert jobs.status_code == 200

        # Step 4: View audit logs
        logs = client.get("/admin/audit-logs", headers=admin_headers)
        assert logs.status_code == 200

        # Step 5: System alerts
        alerts = client.get("/admin/alerts", headers=admin_headers)
        assert alerts.status_code == 200


# ── Flow 4: Team Collaboration ────────────────────────────────────────────────


class TestFlow4TeamCollaboration:
    """Flow: Owner invites Dept Head → Accept → View scoped apps → Recommend."""

    def test_department_head_recommendation_flow(
        self, client: TestClient, db_session: Session
    ):
        # Step 1: Owner creates company
        owner_headers = _register_employer(
            client, db_session, email="owner@corp.vn", company_name="Corp VN"
        )

        # Step 2: Create department
        dept = client.post(
            "/employer/departments",
            json={"name": "Engineering"},
            headers=owner_headers,
        )
        assert dept.status_code == 201
        dept_id = dept.json()["id"]

        # Step 3: Invite a department head
        invitation = client.post(
            "/employer/team/invitations",
            json={
                "email": "head@corp.vn",
                "member_role": "department_head",
                "department_id": dept_id,
            },
            headers=owner_headers,
        )
        assert invitation.status_code == 201
        token = invitation.json()["invite_token"]

        # Step 4: Accept invitation
        accept = client.post(
            f"/employer/invitations/{token}/accept",
            json={"full_name": "Lead Engineer", "password": PASSWORD},
        )
        assert accept.status_code == 200

        # Step 5: Head can login and see context
        head_login = client.post(
            "/auth/login",
            json={"email": "head@corp.vn", "password": PASSWORD},
        )
        head_headers = {"Authorization": f"Bearer {head_login.json()['access_token']}"}

        context = client.get("/employer/company-context", headers=head_headers)
        assert context.status_code == 200
        assert "candidate:recommend" in context.json()["permissions"]

        # Step 6: Owner posts job and candidate applies
        job = client.post(
            "/jobs",
            json={**JOB_PAYLOAD, "department_id": dept_id},
            headers=owner_headers,
        )
        assert job.status_code == 201
        job_id = job.json()["id"]

        cand_headers = _register_candidate(client, email="applicant@test.com")
        cand_user = crud_user.get_by_email(db_session, email="applicant@test.com")
        assert cand_user is not None
        resume_id = _create_test_resume(db_session, cand_user.id)

        apply = client.post(
            "/applications",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=cand_headers,
        )
        assert apply.status_code == 201
        app_id = apply.json()["id"]

        # Step 7: Department head writes recommendation
        rec = client.put(
            f"/applications/{app_id}/recommendation",
            json={
                "recommendation": "recommended",
                "note": "Strong candidate, good culture fit.",
            },
            headers=head_headers,
        )
        assert rec.status_code == 200
        assert rec.json()["hiring_recommendation"] == "recommended"


# ── Flow 5: CV Builder & AI Tools ─────────────────────────────────────────────


class TestFlow5CVBuilderTools:
    """Flow: Create CV → Preview → Apply with Builder CV."""

    def test_cv_builder_create_and_apply(
        self, client: TestClient, db_session: Session
    ):
        cand_headers = _register_candidate(client, email="builder@test.com")

        # Step 1: Create a CV document via builder
        cv_data = {
            "template_id": "professional",
            "title": "My Professional CV",
            "full_name": "Builder User",
            "email": "builder@test.com",
            "phone": "0901234567",
            "summary": "Experienced fullstack developer",
            "experiences": [
                {
                    "company": "TechCorp",
                    "position": "Developer",
                    "start_date": "2023-01",
                    "end_date": "2026-01",
                    "description": "Built APIs with FastAPI",
                }
            ],
            "education": [
                {
                    "school": "HUST",
                    "degree": "Bachelor",
                    "field": "Computer Science",
                    "start_date": "2019",
                    "end_date": "2023",
                }
            ],
            "skills": ["Python", "React", "TypeScript", "PostgreSQL"],
        }
        create_resp = client.post("/cv-documents", json=cv_data, headers=cand_headers)
        assert create_resp.status_code == 201
        cv_id = create_resp.json()["id"]

        # Step 2: List CV documents
        list_resp = client.get("/cv-documents/me", headers=cand_headers)
        assert list_resp.status_code == 200
        assert any(doc["id"] == cv_id for doc in list_resp.json())

        # Step 3: Get specific CV document
        get_resp = client.get(f"/cv-documents/{cv_id}", headers=cand_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "My Professional CV"

        # Step 4: Employer creates job, candidate applies with builder CV
        emp_headers = _register_employer(
            client, db_session, email="emp5@test.com", company_name="Corp5"
        )
        job = client.post("/jobs", json=JOB_PAYLOAD, headers=emp_headers)
        assert job.status_code == 201
        job_id = job.json()["id"]

        apply = client.post(
            "/applications",
            json={"job_id": job_id, "cv_document_id": cv_id},
            headers=cand_headers,
        )
        assert apply.status_code == 201
        assert apply.json()["cv_document_id"] == cv_id


# ── Flow 6: Recruitment Request Workflow ──────────────────────────────────────


class TestFlow6RecruitmentRequest:
    """Flow: Dept Head Creates Request → Submit → HR/Owner Approves."""

    def test_recruitment_request_lifecycle(
        self, client: TestClient, db_session: Session
    ):
        owner_headers = _register_employer(
            client, db_session, email="owner6@corp.vn", company_name="Corp6"
        )

        # Step 1: Create department
        dept = client.post(
            "/employer/departments",
            json={"name": "Marketing"},
            headers=owner_headers,
        )
        assert dept.status_code == 201
        dept_id = dept.json()["id"]

        # Step 2: Invite department head
        inv = client.post(
            "/employer/team/invitations",
            json={
                "email": "head6@corp.vn",
                "member_role": "department_head",
                "department_id": dept_id,
            },
            headers=owner_headers,
        )
        assert inv.status_code == 201
        token = inv.json()["invite_token"]

        accept = client.post(
            f"/employer/invitations/{token}/accept",
            json={"full_name": "Marketing Head", "password": PASSWORD},
        )
        assert accept.status_code == 200

        head_login = client.post(
            "/auth/login", json={"email": "head6@corp.vn", "password": PASSWORD}
        )
        head_headers = {"Authorization": f"Bearer {head_login.json()['access_token']}"}

        # Step 3: Department Head creates a recruitment request (draft)
        req_data = {
            "title": "Content Writer Needed",
            "headcount": 2,
            "priority": "high",
            "reason": "Growing team, 5 new client contracts",
            "responsibilities": "Writing high quality technical articles and blogs for SEO.",
            "requirements": "3+ years of experience in copywriting and digital marketing.",
        }
        create = client.post(
            "/employer/recruitment-requests",
            json=req_data,
            headers=head_headers,
        )
        assert create.status_code == 201
        req_id = create.json()["id"]
        assert create.json()["status"] == "draft"

        # Step 4: Department Head submits for review
        submit = client.post(
            f"/employer/recruitment-requests/{req_id}/submit",
            headers=head_headers,
        )
        assert submit.status_code == 200
        assert submit.json()["status"] == "submitted"

        # Step 5: HR/Owner reviews & approves the request
        approve = client.post(
            f"/employer/recruitment-requests/{req_id}/review",
            json={"decision": "approved", "note": "Approved. High priority for Q3."},
            headers=owner_headers,
        )
        assert approve.status_code == 200
        assert approve.json()["status"] == "approved"
