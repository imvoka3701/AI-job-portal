"""Tests for Resume CRUD, file upload logic, and embedding generation."""

import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.resume import crud_resume

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
) -> dict[str, str]:
    resp = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
            "role": role,
        },
    )
    assert resp.status_code in (200, 201), resp.text
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
