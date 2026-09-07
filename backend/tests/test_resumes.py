"""Tests for Resume CRUD, file upload logic, and embedding generation."""

import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.resume import crud_resume
from app.schemas.resume import ResumeCreate

# ─── Helpers ────────────────────────────────────────────────────────────────────


def _make_minimal_pdf(text: str) -> bytes:
    """Build a minimal valid PDF containing the given text."""
    escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    header = b"%PDF-1.4\n"
    obj1 = b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    obj2 = b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    obj3 = b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    stream_body = ("BT /F1 12 Tf 72 700 Td (" + escaped + ") Tj ET").encode("ascii")
    obj4 = (
        b"4 0 obj<</Length "
        + str(len(stream_body)).encode()
        + b">>stream\n"
        + stream_body
        + b"\nendstream\nendobj\n"
    )
    obj5 = b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    parts = [obj1, obj2, obj3, obj4, obj5]
    offset = len(header)
    xrefs = []
    for p in parts:
        xrefs.append(offset)
        offset += len(p)
    xref_start = offset
    xref_lines = b"xref\n0 6\n0000000000 65535 f \n"
    for o in xrefs:
        xref_lines += (f"{o:010d} 00000 n \n").encode()
    trailer = (
        b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n" + str(xref_start).encode() + b"\n%%EOF\n"
    )
    return header + b"".join(parts) + xref_lines + trailer


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str,
    full_name: str = "Test",
    role: str = "candidate",
    company_name: str | None = None,
) -> dict[str, str]:
    reg_role = "candidate" if role == "admin" else role
    payload: dict = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": reg_role,
    }
    if company_name:
        payload["company_name"] = company_name

    resp = client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201), resp.text
    if role == "employer":
        from app.models.user import User

        user = db_session.query(User).filter(User.email == email).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()
    elif role == "admin":
        from app.models.user import User, UserRole

        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.role = UserRole.ADMIN
            db_session.commit()

    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200, login_resp.text
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


# ─── Tests ──────────────────────────────────────────────────────────────────────


class TestResumeUpload:
    def test_upload_pdf_success(self, client: TestClient, db_session: Session, monkeypatch):
        """Upload a valid PDF — should create resume with embedding."""
        from app.services.cv_evaluator import cv_evaluator_service

        async def valid_cv(_text):
            return True

        monkeypatch.setattr(cv_evaluator_service, "validate_is_cv", valid_cv)
        headers = _register_and_login(client, db_session, "ru@t.com", "p")
        pdf = _make_minimal_pdf(
            "Skills: Python FastAPI PostgreSQL Docker Redis CI/CD. "
            "Experience: 5 years Python backend development with REST API design."
        )
        resp = client.post(
            "/resumes/upload",
            files={"file": ("resume.pdf", io.BytesIO(pdf), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["title"] == "resume.pdf"
        assert data["id"] > 0

    def test_upload_text_too_short(self, client: TestClient, db_session: Session):
        """PDF with too little text should be rejected (422)."""
        headers = _register_and_login(client, db_session, "rut@t.com", "p")
        pdf = _make_minimal_pdf("Hi")
        resp = client.post(
            "/resumes/upload",
            files={"file": ("tiny.pdf", io.BytesIO(pdf), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 422, f"Expected 422, got {resp.status_code}: {resp.text}"

    def test_upload_non_pdf_rejected(self, client: TestClient, db_session: Session):
        """Uploading a non-PDF file should be rejected (400)."""
        headers = _register_and_login(client, db_session, "rnp@t.com", "p")
        resp = client.post(
            "/resumes/upload",
            files={"file": ("data.txt", io.BytesIO(b"hello world"), "text/plain")},
            headers=headers,
        )
        assert resp.status_code == 400, resp.text

    def test_requires_auth(self, client: TestClient):
        """Upload without auth should fail (401)."""
        resp = client.post(
            "/resumes/upload",
            files={"file": ("r.pdf", io.BytesIO(b"x"), "application/pdf")},
        )
        assert resp.status_code == 401


class TestResumeCRUD:
    def test_get_my_resumes(self, client: TestClient, db_session: Session):
        """Candidate can list their own resumes."""
        headers = _register_and_login(client, db_session, "rm@t.com", "p")
        resp = client.get("/resumes/me", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_resume_by_id(self, client: TestClient, db_session: Session):
        """Fetch a specific resume by ID."""
        from app.schemas.resume import ResumeCreate

        headers = _register_and_login(client, db_session, "rbi@t.com", "p")
        me = client.get("/users/me", headers=headers).json()
        resume = crud_resume.create(
            db_session,
            obj_in=ResumeCreate(
                title="test.pdf",
                file_url="u/test.pdf",
                raw_text="Dev skills...",
                embedding=[0.05] * 384,
            ),
            user_id=me["id"],
        )

        resp = client.get(f"/resumes/{resume.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "test.pdf"

    def test_delete_resume(self, client: TestClient, db_session: Session):
        """Candidate can delete their own resume."""
        from app.schemas.resume import ResumeCreate

        headers = _register_and_login(client, db_session, "rd@t.com", "p")
        me = client.get("/users/me", headers=headers).json()
        resume = crud_resume.create(
            db_session,
            obj_in=ResumeCreate(
                title="del.pdf",
                file_url="u/del.pdf",
                raw_text="Skills...",
                embedding=[0.05] * 384,
            ),
            user_id=me["id"],
        )

        resp = client.delete(f"/resumes/{resume.id}", headers=headers)
        assert resp.status_code == 204

        # Verify gone
        resp2 = client.get(f"/resumes/{resume.id}", headers=headers)
        assert resp2.status_code == 404

    def test_cannot_delete_others_resume(self, client: TestClient, db_session: Session):
        """User cannot delete another user's resume."""
        from app.schemas.resume import ResumeCreate

        h1 = _register_and_login(client, db_session, "ro1@t.com", "p", "U1")
        h2 = _register_and_login(client, db_session, "ro2@t.com", "p", "U2")
        me1 = client.get("/users/me", headers=h1).json()
        resume = crud_resume.create(
            db_session,
            obj_in=ResumeCreate(
                title="mine.pdf",
                file_url="u/mine.pdf",
                raw_text="Skills...",
                embedding=[0.05] * 384,
            ),
            user_id=me1["id"],
        )

        resp = client.delete(f"/resumes/{resume.id}", headers=h2)
        assert resp.status_code in (403, 404), (
            f"Should not allow delete by other user, got {resp.status_code}"
        )

    def test_delete_resume_logs_warning_on_os_error(
        self, client: TestClient, db_session: Session, monkeypatch, caplog
    ):
        h1 = _register_and_login(client, db_session, "del_warn@t.com", "p", "U1")
        me1 = client.get("/users/me", headers=h1).json()
        resume = crud_resume.create(
            db_session,
            obj_in=ResumeCreate(
                title="mine.pdf",
                file_url="uploads/mine.pdf",
                raw_text="Skills...",
                embedding=[0.05] * 384,
            ),
            user_id=me1["id"],
        )

        import os
        monkeypatch.setattr(os.path, "exists", lambda p: True)
        monkeypatch.setattr(os.path, "isfile", lambda p: True)

        def mock_remove(_path):
            raise OSError("Permission denied test")

        monkeypatch.setattr(os, "remove", mock_remove)

        with caplog.at_level("WARNING"):
            resp = client.delete(f"/resumes/{resume.id}", headers=h1)
            assert resp.status_code == 204
            assert any("Không thể xoá file vật lý" in rec.message for rec in caplog.records)


class TestResumeEmbedding:
    def test_embedding_generated_on_upload(
        self, client: TestClient, db_session: Session, monkeypatch
    ):
        from app.services.cv_evaluator import cv_evaluator_service

        async def valid_cv(_text):
            return True

        monkeypatch.setattr(cv_evaluator_service, "validate_is_cv", valid_cv)
        """After uploading a valid PDF, embedding should be stored (not NULL)."""
        headers = _register_and_login(client, db_session, "re@t.com", "p")
        pdf = _make_minimal_pdf(
            "Skills: Python FastAPI PostgreSQL Docker Redis Kubernetes AWS. "
            "Experience: 5 years Python backend development, microservices architecture, "
            "REST API design, database performance optimization, team leadership."
        )
        resp = client.post(
            "/resumes/upload",
            files={"file": ("cv.pdf", io.BytesIO(pdf), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 201, resp.text

        # Verify embedding was generated — query the resume
        resume_id = resp.json()["id"]
        from app.models.resume import Resume

        resume = db_session.query(Resume).filter(Resume.id == resume_id).first()
        assert resume is not None
        assert resume.embedding is not None, "Embedding must be generated"
        assert len(resume.embedding) == 384, f"Expected 384-dim, got {len(resume.embedding)}"
        assert any(v != 0.0 for v in resume.embedding), "Embedding should not be all zeros"


class TestResumeRoleAuthorization:
    def test_employer_blocked_from_upload_resume(self, client: TestClient, db_session: Session):
        """Employer role must be rejected with 403 when attempting to upload a resume."""
        emp_headers = _register_and_login(
            client, db_session, "emp_resume@t.com", "p", role="employer"
        )
        pdf = _make_minimal_pdf("Test resume text content here.")
        resp = client.post(
            "/resumes/upload",
            files={"file": ("cv.pdf", io.BytesIO(pdf), "application/pdf")},
            headers=emp_headers,
        )
        assert resp.status_code == 403, (
            f"Expected 403 Forbidden, got {resp.status_code}: {resp.text}"
        )

    def test_employer_blocked_from_create_resume(self, client: TestClient, db_session: Session):
        """Employer role must be rejected with 403 when attempting to create a resume."""
        emp_headers = _register_and_login(
            client, db_session, "emp_res2@t.com", "p", role="employer"
        )
        resp = client.post(
            "/resumes",
            json={"title": "My Resume", "file_url": "/test.pdf", "raw_text": "Skills"},
            headers=emp_headers,
        )
        assert resp.status_code == 403, (
            f"Expected 403 Forbidden, got {resp.status_code}: {resp.text}"
        )


class TestResumeAccessControl:
    """Security tests for resume content preview and download access control (Issue #9)."""

    def test_direct_static_cv_access_blocked(self, client: TestClient):
        """Direct access to /uploads/1/resume.pdf must return 404 since CVs are not statically mounted."""
        resp = client.get("/uploads/1/secret_resume.pdf")
        assert resp.status_code == 404

    def test_legacy_avatar_access_allowed(self, client: TestClient):
        """Legacy avatar path allows files starting with avatar_ only."""
        # Non-avatar file
        resp = client.get("/uploads/1/my_document.pdf")
        assert resp.status_code == 404

    def test_candidate_and_employer_rbac(
        self, client: TestClient, db_session: Session, monkeypatch
    ):
        from app.services.cv_evaluator import cv_evaluator_service

        async def valid_cv(_text, **kwargs):
            return True, ""

        monkeypatch.setattr(cv_evaluator_service, "validate_is_cv", valid_cv)

        cand1_headers = _register_and_login(
            client, db_session, "cand1_preview@t.com", "p", role="candidate"
        )
        pdf = _make_minimal_pdf(
            "Nguyen Van A. Email: cand1@test.com. Phone: 0912345678. "
            "Kinh nghiem lam viec: Python developer 3 nam tai Cong ty ABC. "
            "Hoc van: Dai hoc Bach Khoa Ha Noi. Ky nang: Python, FastAPI."
        )
        up_resp = client.post(
            "/resumes/upload",
            files={"file": ("cv.pdf", io.BytesIO(pdf), "application/pdf")},
            headers=cand1_headers,
        )
        assert up_resp.status_code == 201
        resume_id = up_resp.json()["id"]

        # Owner can view
        resp = client.get(f"/resumes/{resume_id}/content", headers=cand1_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"

        # Other candidate blocked
        cand2_headers = _register_and_login(
            client, db_session, "cand2_preview@t.com", "p", role="candidate"
        )
        resp2 = client.get(f"/resumes/{resume_id}/content", headers=cand2_headers)
        assert resp2.status_code == 403

        # Unrelated employer blocked
        emp_unrelated_headers = _register_and_login(
            client, db_session, "emp_unrelated@t.com", "p", role="employer", company_name="Corp X"
        )
        resp_emp_unrelated = client.get(f"/resumes/{resume_id}/content", headers=emp_unrelated_headers)
        assert resp_emp_unrelated.status_code == 403

        # Employer with application allowed
        emp_hiring_headers = _register_and_login(
            client, db_session, "emp_hiring@t.com", "p", role="employer", company_name="Hiring Corp"
        )
        job_resp = client.post(
            "/jobs",
            json={
                "title": "Backend Python Engineer",
                "description": "Developing high-performance microservices with FastAPI and Postgres.",
                "requirements": "Python, FastAPI, Docker",
                "benefits": "Competitive salary, 13th month bonus",
                "job_type": "full_time",
                "experience_level": "middle",
                "location": "Hanoi",
            },
            headers=emp_hiring_headers,
        )
        assert job_resp.status_code == 201
        job_id = job_resp.json()["id"]

        # Candidate applies to this job
        app_resp = client.post(
            "/applications",
            json={"job_id": job_id, "resume_id": resume_id, "cover_letter": "I want to join."},
            headers=cand1_headers,
        )
        assert app_resp.status_code == 201

        # Now hiring employer can access resume
        resp_emp_hiring = client.get(f"/resumes/{resume_id}/content", headers=emp_hiring_headers)
        assert resp_emp_hiring.status_code == 200
        assert resp_emp_hiring.headers["content-type"] == "application/pdf"

        # Admin can access resume
        admin_headers = _register_and_login(
            client, db_session, "admin_preview@t.com", "p", role="admin"
        )
        resp_admin = client.get(f"/resumes/{resume_id}/content", headers=admin_headers)
        assert resp_admin.status_code == 200


