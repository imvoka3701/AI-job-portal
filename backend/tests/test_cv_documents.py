"""Tests for structured CV Builder documents and ownership rules."""

import httpx
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.schemas.ai import CvSummarySuggestionResponse
from app.services.cv_suggestions import cv_suggestion_service


def _login(client: TestClient, email: str) -> dict[str, str]:
    registered = client.post(
        "/auth/register",
        json={"email": email, "password": "p", "full_name": email, "role": "candidate"},
    )
    assert registered.status_code in (200, 201), registered.text
    login = client.post("/auth/login", json={"email": email, "password": "p"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


class TestCvDocuments:
    def test_create_list_update_and_delete(self, client: TestClient, db_session: Session):
        headers = _login(client, "cv-owner@example.com")
        content = {"version": 1, "personal": {"full_name": "Owner"}, "summary": "Backend developer"}
        created = client.post(
            "/cv-documents",
            json={
                "title": "Backend CV",
                "template_key": "modern-two-column",
                "content_json": content,
            },
            headers=headers,
        )
        assert created.status_code == 201, created.text
        document = created.json()
        assert document["status"] == "draft"
        assert document["content_json"]["summary"] == "Backend developer"

        listed = client.get("/cv-documents/me", headers=headers)
        assert listed.status_code == 200
        assert listed.json()[0]["id"] == document["id"]

        updated = client.patch(
            f"/cv-documents/{document['id']}",
            json={"status": "published", "content_json": {**content, "summary": "Updated"}},
            headers=headers,
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "published"
        assert updated.json()["content_json"]["summary"] == "Updated"

        deleted = client.delete(f"/cv-documents/{document['id']}", headers=headers)
        assert deleted.status_code == 204
        assert client.get(f"/cv-documents/{document['id']}", headers=headers).status_code == 404

    def test_reject_invalid_template(self, client: TestClient):
        headers = _login(client, "cv-invalid@example.com")
        response = client.post(
            "/cv-documents", json={"template_key": "unknown-template"}, headers=headers
        )
        assert response.status_code == 422

    def test_cannot_access_another_users_document(self, client: TestClient):
        owner_headers = _login(client, "cv-owner-2@example.com")
        other_headers = _login(client, "cv-other@example.com")
        created = client.post("/cv-documents", json={"title": "Private CV"}, headers=owner_headers)
        document_id = created.json()["id"]
        assert client.get(f"/cv-documents/{document_id}", headers=other_headers).status_code == 404
        assert (
            client.patch(
                f"/cv-documents/{document_id}", json={"title": "Hijack"}, headers=other_headers
            ).status_code
            == 404
        )
        assert (
            client.delete(f"/cv-documents/{document_id}", headers=other_headers).status_code == 404
        )

    def test_ai_suggestion_returns_structured_success(self, client: TestClient, monkeypatch):
        headers = _login(client, "cv-ai-success@example.com")
        document = client.post("/cv-documents", json={"title": "AI CV"}, headers=headers).json()

        async def fake_summary(**_kwargs):
            return CvSummarySuggestionResponse(
                suggestion="Tóm tắt có cấu trúc", rationale="Bám sát vị trí mục tiêu"
            )

        monkeypatch.setattr(cv_suggestion_service, "suggest_summary", fake_summary)
        response = client.post(
            "/ai/cv/suggest-summary",
            json={
                "cv_document_id": document["id"],
                "current_text": "",
                "target_role": "Backend Developer",
                "language": "vi",
            },
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["suggestion"] == "Tóm tắt có cấu trúc"

    def test_ai_timeout_has_retryable_error_contract(self, client: TestClient, monkeypatch):
        headers = _login(client, "cv-ai-timeout@example.com")
        document = client.post("/cv-documents", json={"title": "AI CV"}, headers=headers).json()

        async def timeout_summary(**_kwargs):
            raise httpx.ReadTimeout("provider timeout")

        monkeypatch.setattr(cv_suggestion_service, "suggest_summary", timeout_summary)
        response = client.post(
            "/ai/cv/suggest-summary",
            json={
                "cv_document_id": document["id"],
                "current_text": "",
                "target_role": "Backend Developer",
                "language": "vi",
            },
            headers=headers,
        )
        assert response.status_code == 504
        assert response.json()["error"] == {
            "code": "AI_TIMEOUT",
            "message": "Dịch vụ AI phản hồi quá thời gian. Vui lòng thử lại.",
            "retryable": True,
        }


class TestCvSuggestionParsing:
    def test_accepts_plain_json(self):
        result = cv_suggestion_service._parse_response(
            '{"suggestion":"Backend developer","rationale":"Bám sát vị trí"}',
            CvSummarySuggestionResponse,
        )
        assert result.suggestion == "Backend developer"

    def test_accepts_markdown_json_fence(self):
        result = cv_suggestion_service._parse_response(
            '```json\n{"suggestion":"Backend developer","rationale":"Bám sát vị trí"}\n```',
            CvSummarySuggestionResponse,
        )
        assert result.rationale == "Bám sát vị trí"
