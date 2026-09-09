"""Unit & Integration tests for Module 3.3: B2B Direct Chat HR <-> Candidate."""

from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str = "Password123!",
    full_name: str = "Test User",
    role: str = "candidate",
    company_name: str | None = None,
) -> tuple[dict[str, str], int]:
    payload: dict = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    ip_suffix = abs(hash(email)) % 240 + 1
    headers = {"X-Forwarded-For": f"10.99.3.{ip_suffix}"}
    resp = client.post("/auth/register", json=payload, headers=headers)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()
    user_id = user_data["id"]

    if role == "employer":
        user = db_session.query(User).filter(User.id == user_id).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()

    login_resp = client.post(
        "/auth/login", json={"email": email, "password": password}, headers=headers
    )
    assert login_resp.status_code == 200, login_resp.text
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}, user_id


def _create_job(client: TestClient, emp_headers: dict[str, str]) -> int:
    resp = client.post(
        "/jobs",
        json={
            "title": "Senior Python Backend Engineer",
            "description": "Develop scalable high-performance FastAPI backends and AI services.",
            "requirements": "Python, FastAPI, PostgreSQL",
            "benefits": "Competitive salary, 100% remote",
            "job_type": "full_time",
            "experience_level": "senior",
            "location": "Hanoi, Vietnam",
        },
        headers=emp_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_direct_chat_flow_and_authorization(client: TestClient, db_session: Session) -> None:
    # 1. Setup Employer and Candidate
    emp_headers, emp_id = _register_and_login(
        client, db_session, "employer_chat@company.com", role="employer", company_name="TechCorp"
    )
    cand_headers, cand_id = _register_and_login(
        client, db_session, "candidate_chat@gmail.com", role="candidate", full_name="Nguyen Van A"
    )
    other_headers, other_id = _register_and_login(
        client, db_session, "stranger_chat@gmail.com", role="candidate", full_name="Stranger"
    )

    # 2. Employer posts job
    job_id = _create_job(client, emp_headers)

    # 3. Candidate applies
    apply_resp = client.post(
        "/applications",
        json={"job_id": job_id, "cover_letter": "I have 5 years experience with FastAPI."},
        headers=cand_headers,
    )
    assert apply_resp.status_code == 201, apply_resp.text
    app_id = apply_resp.json()["id"]

    # 4. Initialize conversation from application
    init_resp = client.post(f"/chat/applications/{app_id}/init", headers=cand_headers)
    assert init_resp.status_code == 200, init_resp.text
    conv_data = init_resp.json()
    conv_id = conv_data["id"]
    assert conv_data["application_id"] == app_id
    assert conv_data["job_id"] == job_id
    assert conv_data["candidate_id"] == cand_id
    assert conv_data["messages"] == []

    # 5. Unauthorized stranger cannot view conversation
    unauth_resp = client.get(f"/chat/conversations/{conv_id}", headers=other_headers)
    assert unauth_resp.status_code == 403

    unauth_send = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Hacking into chat"},
        headers=other_headers,
    )
    assert unauth_send.status_code == 403

    # 6. Employer sends a message to Candidate
    with patch("app.services.websocket_manager.ws_manager.notify_user_sync") as mock_ws_notify:
        send_resp = client.post(
            f"/chat/conversations/{conv_id}/messages",
            json={
                "content": "Chào bạn, hồ sơ của bạn rất ấn tượng. Bạn có thể tham gia phỏng vấn tuần này không?"
            },
            headers=emp_headers,
        )
        assert send_resp.status_code == 201, send_resp.text
        msg_data = send_resp.json()
        assert msg_data["conversation_id"] == conv_id
        assert msg_data["sender_id"] == emp_id
        assert msg_data["is_read"] is False

        # Verify real-time WebSocket notifications were dispatched:
        # 1. Instant chat message frame
        # 2. In-App Notification frame with unread badge
        assert mock_ws_notify.call_count == 2
        calls = mock_ws_notify.call_args_list
        assert calls[0][1]["user_id"] == cand_id
        assert calls[0][1]["payload"]["type"] == "chat_message"
        assert "phỏng vấn" in calls[0][1]["payload"]["data"]["content"]
        assert calls[1][1]["user_id"] == cand_id
        assert calls[1][1]["payload"]["type"] == "notification"

    # 7. Candidate lists conversations -> sees unread count = 1
    cand_list_resp = client.get("/chat/conversations", headers=cand_headers)
    assert cand_list_resp.status_code == 200
    conversations = cand_list_resp.json()
    assert len(conversations) == 1
    assert conversations[0]["id"] == conv_id
    assert conversations[0]["unread_count"] == 1
    assert "hồ sơ của bạn rất ấn tượng" in conversations[0]["last_message"]

    # 8. Candidate replies
    reply_resp = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Dạ em cảm ơn quý công ty, em sẵn sàng phỏng vấn vào thứ Năm ạ."},
        headers=cand_headers,
    )
    assert reply_resp.status_code == 201
    reply_data = reply_resp.json()
    assert reply_data["sender_id"] == cand_id

    # 9. Employer opens conversation detail -> unread messages are marked as read
    detail_resp = client.get(f"/chat/conversations/{conv_id}", headers=emp_headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert len(detail["messages"]) == 2
    assert detail["unread_count"] == 0

    # 10. Test explicit mark as read endpoint
    read_patch = client.patch(f"/chat/conversations/{conv_id}/read", headers=cand_headers)
    assert read_patch.status_code == 200
    assert "marked" in read_patch.json()
