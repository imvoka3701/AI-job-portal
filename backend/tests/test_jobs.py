"""Comprehensive tests for jobs endpoints — CRUD, filters, permissions."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.company import crud_company
from app.crud.user import crud_user

PASSWORD = "StrongPass123!"


def _register_employer(
    client: TestClient,
    db: Session,
    *,
    email: str = "employer@example.com",
    company_name: str = "TestCorp",
) -> dict[str, str]:
    """Register an employer, approve them, and return auth headers."""
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Employer User",
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
    """Register a candidate and return auth headers."""
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Candidate User",
            "role": "candidate",
        },
    )
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


JOB_PAYLOAD = {
    "title": "Senior Python Developer",
    "description": "Build scalable APIs with FastAPI.",
    "requirements": "Python, FastAPI, PostgreSQL, 3+ years experience.",
    "benefits": "Remote, flexible hours, competitive salary",
    "location": "Hà Nội",
    "job_type": "full_time",
    "experience_level": "middle",
    "salary_min": 20000000,
    "salary_max": 40000000,
}


class TestJobsList:
    def test_list_jobs_empty(self, client: TestClient):
        """Test listing jobs when none exist."""
        response = client.get("/jobs")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_job_not_found(self, client: TestClient):
        """Test getting a non-existent job returns 404."""
        response = client.get("/jobs/999")
        assert response.status_code == 404


class TestJobCreate:
    def test_employer_can_create_job(self, client: TestClient, db_session: Session):
        """Test employer can create a job posting."""
        headers = _register_employer(client, db_session)
        response = client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == JOB_PAYLOAD["title"]
        assert data["location"] == "Hà Nội"
        assert data["is_active"] is True

    def test_candidate_cannot_create_job(self, client: TestClient, db_session: Session):
        """Test candidate role is forbidden from creating jobs."""
        headers = _register_candidate(client)
        response = client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        assert response.status_code == 403

    def test_unauthenticated_cannot_create_job(self, client: TestClient):
        """Test unauthenticated users cannot create jobs."""
        response = client.post("/jobs", json=JOB_PAYLOAD)
        assert response.status_code == 401


class TestJobUpdate:
    def test_employer_can_update_job(self, client: TestClient, db_session: Session):
        """Test employer can update their own job."""
        headers = _register_employer(client, db_session)
        create = client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        assert create.status_code == 201
        job_id = create.json()["id"]

        response = client.patch(
            f"/jobs/{job_id}",
            json={"title": "Lead Python Developer", "salary_max": 50000000},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Lead Python Developer"
        assert response.json()["salary_max"] == 50000000

    def test_update_nonexistent_job(self, client: TestClient, db_session: Session):
        """Test updating a non-existent job returns 404."""
        headers = _register_employer(client, db_session)
        response = client.patch("/jobs/999", json={"title": "X"}, headers=headers)
        assert response.status_code == 404


class TestJobDelete:
    def test_employer_can_delete_job(self, client: TestClient, db_session: Session):
        """Test employer can delete their own job."""
        headers = _register_employer(client, db_session)
        create = client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        assert create.status_code == 201
        job_id = create.json()["id"]

        response = client.delete(f"/jobs/{job_id}", headers=headers)
        assert response.status_code == 204

        # Verify job is gone
        get_response = client.get(f"/jobs/{job_id}")
        assert get_response.status_code == 404

    def test_delete_job_with_applications_soft_deletes(self, client: TestClient, db_session: Session):
        """Test that deleting a job with applications soft-deletes (archives) it without FK crash."""
        emp_headers = _register_employer(client, db_session, email="delete_emp2@example.com")
        create = client.post("/jobs", json=JOB_PAYLOAD, headers=emp_headers)
        assert create.status_code == 201
        job_id = create.json()["id"]

        # Candidate applies to this job
        cand_headers = _register_candidate(client, email="delete_cand2@example.com")
        app_resp = client.post("/applications", json={"job_id": job_id}, headers=cand_headers)
        assert app_resp.status_code == 201

        # Employer deletes the job
        del_resp = client.delete(f"/jobs/{job_id}", headers=emp_headers)
        assert del_resp.status_code == 204

        # Check job in database: still exists, but is_active is False
        from app.crud.job import crud_job

        job = crud_job.get_by_id(db_session, job_id=job_id)
        assert job is not None
        assert job.is_active is False

        # Job is hidden from active public listings
        list_resp = client.get("/jobs")
        assert list_resp.status_code == 200
        active_ids = [j["id"] for j in list_resp.json()["items"]]
        assert job_id not in active_ids


class TestJobFilters:
    def test_filter_by_keyword(self, client: TestClient, db_session: Session):
        """Test filtering jobs by keyword in title/description."""
        headers = _register_employer(client, db_session)
        client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        client.post(
            "/jobs",
            json={**JOB_PAYLOAD, "title": "React Frontend Developer", "description": "React TS"},
            headers=headers,
        )

        response = client.get("/jobs", params={"keyword": "Python"})
        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) >= 1
        assert any("Python" in j["title"] for j in items)

    def test_filter_by_job_type(self, client: TestClient, db_session: Session):
        """Test filtering jobs by job_type."""
        headers = _register_employer(client, db_session)
        client.post("/jobs", json=JOB_PAYLOAD, headers=headers)

        response = client.get("/jobs", params={"job_type": "full_time"})
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_pagination(self, client: TestClient, db_session: Session):
        """Test jobs list pagination."""
        headers = _register_employer(client, db_session)
        for i in range(3):
            client.post(
                "/jobs",
                json={**JOB_PAYLOAD, "title": f"Job #{i + 1}"},
                headers=headers,
            )

        page1 = client.get("/jobs", params={"page": 1, "page_size": 2})
        assert page1.status_code == 200
        data = page1.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3

        page2 = client.get("/jobs", params={"page": 2, "page_size": 2})
        assert len(page2.json()["items"]) == 1


class TestJobGet:
    def test_get_existing_job(self, client: TestClient, db_session: Session):
        """Test retrieving a specific job by ID."""
        headers = _register_employer(client, db_session)
        create = client.post("/jobs", json=JOB_PAYLOAD, headers=headers)
        assert create.status_code == 201
        job_id = create.json()["id"]

        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == job_id
        assert data["title"] == JOB_PAYLOAD["title"]

