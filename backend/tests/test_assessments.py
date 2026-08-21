"""Tests for MBTI and MI career assessment tools."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


def _get_auth_headers(client: TestClient, db_session: Session, email: str, role: str = "candidate") -> dict[str, str]:
    client.post("/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Assessment Tester",
        "role": role,
    })
    if role == "employer":
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.is_active = True
            db_session.commit()
    resp = client.post("/auth/login", json={"email": email, "password": "Password123!"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAssessmentQuestionnaires:
    def test_get_mbti_questions(self, client: TestClient):
        resp = client.get("/tools/mbti/questions")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["assessment_type"] == "mbti"
        assert data["version"] == "mbti-v1"
        assert len(data["questions"]) == 40
        assert data["questions"][0]["id"] == "mbti-01"
        assert data["questions"][0]["order"] == 1

    def test_get_mi_questions(self, client: TestClient):
        resp = client.get("/tools/mi/questions")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["assessment_type"] == "mi"
        assert data["version"] == "mi-v1"
        assert len(data["questions"]) == 40
        assert data["questions"][0]["id"] == "mi-01"


class TestAssessmentScoring:
    def test_score_mbti_deterministic(self, client: TestClient):
        answers = {f"mbti-{i:02d}": 5 for i in range(1, 41)}
        payload = {
            "assessment_type": "mbti",
            "questionnaire_version": "mbti-v1",
            "answers": answers,
        }
        resp1 = client.post("/tools/mbti/score", json=payload)
        assert resp1.status_code == 200, resp1.text
        result1 = resp1.json()
        assert result1["code"] == "ESTJ"
        assert "dimensions" in result1
        assert result1["dimensions"]["EI"] == 100.0

        # Deterministic verification
        for _ in range(5):
            resp = client.post("/tools/mbti/score", json=payload)
            assert resp.json()["code"] == result1["code"]

    def test_score_mi_deterministic(self, client: TestClient):
        answers = {f"mi-{i:02d}": 3 for i in range(1, 41)}
        answers["mi-01"] = 5
        answers["mi-02"] = 5
        payload = {
            "assessment_type": "mi",
            "questionnaire_version": "mi-v1",
            "answers": answers,
        }
        resp = client.post("/tools/mi/score", json=payload)
        assert resp.status_code == 200, resp.text
        result = resp.json()
        assert "linguistic" in result["code"]
        assert len(result["strengths"]) > 0

    def test_invalid_version_or_missing_answers(self, client: TestClient):
        payload = {
            "assessment_type": "mbti",
            "questionnaire_version": "invalid-v99",
            "answers": {"mbti-01": 5},
        }
        resp = client.post("/tools/mbti/score", json=payload)
        assert resp.status_code == 422


class TestAssessmentPersistence:
    def test_candidate_save_and_retrieve_attempt(self, client: TestClient, db_session: Session):
        headers = _get_auth_headers(client, db_session, "candidate_assess@test.com")
        answers = {f"mbti-{i:02d}": 4 for i in range(1, 41)}
        payload = {
            "assessment_type": "mbti",
            "questionnaire_version": "mbti-v1",
            "answers": answers,
        }
        resp = client.post("/tools/mbti/attempts", json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        created = resp.json()
        assert created["id"] > 0
        assert created["assessment_type"] == "mbti"
        assert created["result"]["code"] == "ESTJ"

        # Retrieve history
        list_resp = client.get("/tools/attempts/me", headers=headers)
        assert list_resp.status_code == 200
        items = list_resp.json()
        assert len(items) == 1
        assert items[0]["id"] == created["id"]

        # Delete attempt
        del_resp = client.delete(f"/tools/attempts/{created['id']}", headers=headers)
        assert del_resp.status_code == 204

        # Verify deletion
        list_after = client.get("/tools/attempts/me", headers=headers).json()
        assert len(list_after) == 0

    def test_non_candidate_cannot_save_attempt(self, client: TestClient, db_session: Session):
        headers = _get_auth_headers(client, db_session, "employer_assess@test.com", role="employer")

        answers = {f"mbti-{i:02d}": 4 for i in range(1, 41)}
        payload = {
            "assessment_type": "mbti",
            "questionnaire_version": "mbti-v1",
            "answers": answers,
        }
        resp = client.post("/tools/mbti/attempts", json=payload, headers=headers)
        assert resp.status_code == 403

    def test_cannot_delete_other_user_attempt(self, client: TestClient, db_session: Session):
        headers1 = _get_auth_headers(client, db_session, "user1_assess@test.com")
        headers2 = _get_auth_headers(client, db_session, "user2_assess@test.com")

        answers = {f"mbti-{i:02d}": 3 for i in range(1, 41)}
        resp1 = client.post("/tools/mbti/attempts", json={
            "assessment_type": "mbti",
            "questionnaire_version": "mbti-v1",
            "answers": answers,
        }, headers=headers1)
        attempt_id = resp1.json()["id"]

        # User2 tries to delete User1's attempt
        del_resp = client.delete(f"/tools/attempts/{attempt_id}", headers=headers2)
        assert del_resp.status_code == 404
