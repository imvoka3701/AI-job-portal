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
    """Test empty messages validation (Pydantic min_length=1 returns 422)."""
    resp = client.post("/ai/assistant/chat", json={"messages": []})
    assert resp.status_code in (400, 422)


def test_assistant_chat_security_limits(client: TestClient):
    """Test message length > 2000 chars and history > 20 messages are rejected."""
    # 1. Message exceeding 2000 characters
    long_msg = "A" * 2001
    resp = client.post("/ai/assistant/chat", json={"messages": [{"role": "user", "content": long_msg}]})
    assert resp.status_code == 422

    # 2. History exceeding 20 messages
    too_many_msgs = [{"role": "user", "content": f"msg {i}"} for i in range(21)]
    resp2 = client.post("/ai/assistant/chat", json={"messages": too_many_msgs})
    assert resp2.status_code == 422


@patch(
    "app.services.assistant_service.deepseek_client.create_chat_completion", new_callable=AsyncMock
)
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
        "messages": [{"role": "user", "content": "Tìm cho tôi việc làm React tại Hà Nội"}],
        "context": {"current_path": "/jobs", "role": "candidate"},
    }

    resp = client.post("/ai/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "React Developer" in str(data)
    assert len(data["suggested_cards"]) == 1
    assert data["suggested_cards"][0]["card_type"] == "job"
    assert data["suggested_cards"][0]["url"] == "/jobs/1"


@patch(
    "app.services.assistant_service.deepseek_client.create_chat_completion", new_callable=AsyncMock
)
def test_assistant_chat_fallback_guest_lead_conversion(mock_create_chat, client: TestClient):
    """Test fallback response contains guest registration CTA card and followups."""
    mock_create_chat.side_effect = Exception("API connection timed out")

    payload = {
        "messages": [{"role": "user", "content": "Xin chào, bạn có thể làm gì?"}],
        "context": {"current_path": "/", "role": "guest"},
    }

    resp = client.post("/ai/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "JobPortal AI" in data["reply"]
    # Check that guest gets a register action card
    assert any(c.get("url") == "/register" for c in data["suggested_cards"])
    assert any("Đăng ký" in fu for fu in data["suggested_followups"])


@patch(
    "app.services.assistant_service.deepseek_client.create_chat_completion", new_callable=AsyncMock
)
def test_assistant_chat_banana_pivot_and_guest_cta(mock_create_chat, client: TestClient):
    """Test off-topic question ('bạn có bán chuối không') leads to diplomatic pivot & guest action card."""
    mock_create_chat.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"reply": "Haha, JobPortal không bán chuối rồi bạn ơi! Nhưng nếu bạn muốn tìm việc làm lương cao để mua cả vườn chuối, hãy thử làm bài test tính cách MBTI nhé!", "suggested_cards": [{"card_type": "tool", "title": "Trắc Nghiệm MBTI", "url": "/tools/mbti"}], "suggested_followups": ["Khám phá cơ hội việc làm"]}'
                }
            }
        ]
    }

    payload = {
        "messages": [{"role": "user", "content": "Bạn có bán chuối không?"}],
        "context": {"current_path": "/", "role": "guest"},
    }

    resp = client.post("/ai/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "chuối" in data["reply"]
    # Auto-attached guest conversion card for guest user asking off-topic/banana
    assert any(c.get("url") == "/register" for c in data["suggested_cards"])
