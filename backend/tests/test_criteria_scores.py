"""Tests for CriteriaScore: CRUD, bulk replace, auto-sync round.score."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.interview_round import InterviewRound


def _register_and_login(client, db_session, email, password, full_name="Test", role="candidate", company_name=None):
    payload = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()
    if role == "employer":
        from app.models.user import User
        user = db_session.query(User).filter(User.id == user_data["id"]).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()
    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


def _create_job(client, emp_headers):
    resp = client.post("/jobs", json={
        "title": "Test Job", "description": "A test job posting with enough text.",
        "requirements": "Python", "benefits": "Remote",
        "job_type": "full_time", "experience_level": "junior", "location": "Hanoi",
    }, headers=emp_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestCriteriaScores:
    def test_get_empty_criteria(self, client: TestClient, db_session: Session):
        """GET /rounds/{id}/criteria returns empty list for unscored round."""
        cand = _register_and_login(client, db_session, "cs1_c@t.com", "p")
        emp = _register_and_login(client, db_session, "cs1_e@t.com", "p", "E", "employer", "C")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]
        r1 = db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).first()

        resp = client.get(f"/rounds/{r1.id}/criteria", headers=emp)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_bulk_replace_and_syncs_average(self, client: TestClient, db_session: Session):
        """PUT /rounds/{id}/criteria replaces all and syncs round.score."""
        cand = _register_and_login(client, db_session, "cs2_c@t.com", "p")
        emp = _register_and_login(client, db_session, "cs2_e@t.com", "p", "E2", "employer", "C2")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]
        r1 = db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).first()

        # Submit 5 criteria scores
        criteria = [
            {"criteria_name": "Kỹ năng chuyên môn", "score": 8, "notes": "Tốt"},
            {"criteria_name": "Kỹ năng giao tiếp", "score": 7, "notes": "Rõ ràng"},
            {"criteria_name": "Kinh nghiệm thực tế", "score": 6, "notes": "Khá"},
            {"criteria_name": "Thái độ", "score": 9, "notes": "Tích cực"},
            {"criteria_name": "Phù hợp văn hóa", "score": 8, "notes": None},
        ]

        resp = client.put(f"/rounds/{r1.id}/criteria", json={"criteria": criteria}, headers=emp)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert len(data) == 5

        # Verify round.score = average of 8+7+6+9+8 = 38/5 = 7.6 → rounded to 8
        db_session.refresh(r1)
        assert r1.score == 8

        # Verify individual scores
        assert data[0]["criteria_name"] == "Kỹ năng chuyên môn"
        assert data[0]["score"] == 8

    def test_bulk_replace_overwrites_old(self, client: TestClient, db_session: Session):
        """Second PUT replaces all previous criteria."""
        cand = _register_and_login(client, db_session, "cs3_c@t.com", "p")
        emp = _register_and_login(client, db_session, "cs3_e@t.com", "p", "E3", "employer", "C3")
        job_id = _create_job(client, emp)

        app_id = client.post("/applications", json={"job_id": job_id}, headers=cand).json()["id"]
        r1 = db_session.query(InterviewRound).filter(InterviewRound.application_id == app_id).first()

        # First set
        client.put(f"/rounds/{r1.id}/criteria", json={"criteria": [
            {"criteria_name": "A", "score": 5}, {"criteria_name": "B", "score": 7},
        ]}, headers=emp)

        # Second set — should replace (not append)
        resp = client.put(f"/rounds/{r1.id}/criteria", json={"criteria": [
            {"criteria_name": "X", "score": 9},
        ]}, headers=emp)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["criteria_name"] == "X"

        # Round score should be 9 (only X)
        db_session.refresh(r1)
        assert r1.score == 9
