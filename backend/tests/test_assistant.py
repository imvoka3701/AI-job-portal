"""Tests for JobPortal AI Copilot Assistant endpoints."""

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


def test_assistant_suggestions(client: TestClient):
    """Test getting contextual 1-click suggestion chips."""
    # Test guest home page suggestions
    resp = client.get("/ai/assistant/suggestions?path=/&role=guest")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    assert any("CV" in s["label"] or "MBTI" in s["label"] or "việc" in s["label"] for s in data)

    # Test employer suggestions
    resp_emp = client.get("/ai/assistant/suggestions?path=/employer/jobs&role=employer")
    assert resp_emp.status_code == 200
    data_emp = resp_emp.json()
    assert any("JD" in s["label"] or "PV" in s["label"] or "ATS" in s["label"] for s in data_emp)


def test_assistant_chat_validation(client: TestClient):
    """Test empty messages validation."""
    resp = client.post("/ai/assistant/chat", json={"messages": []})
    assert resp.status_code == 400


@patch("app.services.assistant_service.deepseek_client.create_chat_completion", new_callable=AsyncMock)
def test_assistant_chat_success(mock_create_chat, client: TestClient):
    """Test AI assistant chat response parsing."""
    mock_create_chat.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"reply": "Chào bạn! Tôi có thể giúp bạn tìm việc làm IT tại Hà Nội.", "suggested_cards": [{"card_type": "job", "title": "Senior React Developer", "subtitle": "Hà Nội · 25-35M", "url": "/jobs/1"}], "suggested_followups": ["Xem thêm việc làm React"]}'
                }
            }
        ]
    }

    payload = {
        "messages": [
            {"role": "user", "content": "Tìm cho tôi việc làm React tại Hà Nội"}
        ],
        "context": {
            "current_path": "/jobs",
            "role": "candidate"
        }
    }

    resp = client.post("/ai/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "React Developer" in str(data)
    assert len(data["suggested_cards"]) == 1
    assert data["suggested_cards"][0]["card_type"] == "job"
    assert data["suggested_cards"][0]["url"] == "/jobs/1"


@patch("app.services.assistant_service.deepseek_client.create_chat_completion", new_callable=AsyncMock)
def test_assistant_chat_fallback(mock_create_chat, client: TestClient):
    """Test fallback response when LLM service throws an error."""
    mock_create_chat.side_effect = Exception("API connection timed out")

    payload = {
        "messages": [
            {"role": "user", "content": "Xin chào, bạn có thể làm gì?"}
        ],
        "context": {
            "current_path": "/",
            "role": "guest"
        }
    }

    resp = client.post("/ai/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "JobPortal AI Copilot" in data["reply"]
    assert len(data["suggested_followups"]) > 0
