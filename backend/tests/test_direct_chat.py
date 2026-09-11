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


def test_chat_security_privacy_and_admin_governance(client: TestClient, db_session: Session) -> None:
    from app.models.user import UserRole

    # 1. Setup Employer, Candidate, and Admin
    emp_headers, emp_id = _register_and_login(
        client, db_session, "employer_sec@company.com", role="employer", company_name="SecurityInc"
    )
    cand_headers, cand_id = _register_and_login(
        client, db_session, "candidate_sec@gmail.com", role="candidate", full_name="Tran Van B"
    )
    admin_headers, admin_id = _register_and_login(
        client, db_session, "admin_sec@domain.com", role="candidate", full_name="Security Admin"
    )
    admin_user = db_session.query(User).filter(User.id == admin_id).first()
    assert admin_user is not None
    admin_user.role = UserRole.ADMIN
    db_session.commit()

    # 2. Setup job, application, and conversation with messages
    job_id = _create_job(client, emp_headers)
    apply_resp = client.post(
        "/applications",
        json={"job_id": job_id, "cover_letter": "Confidential discussion"},
        headers=cand_headers,
    )
    app_id = apply_resp.json()["id"]

    init_resp = client.post(f"/chat/applications/{app_id}/init", headers=emp_headers)
    conv_id = init_resp.json()["id"]

    # Exchange a message
    client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Nội dung trao đổi cực kỳ bí mật và riêng tư."},
        headers=emp_headers,
    )

    # 3. ZERO-KNOWLEDGE PRIVACY AUDIT: Admin CANNOT read messages or access conversation
    admin_detail = client.get(f"/chat/conversations/{conv_id}", headers=admin_headers)
    assert admin_detail.status_code == 403, f"Admin must be forbidden from reading chat! Got: {admin_detail.status_code}"

    admin_messages = client.get(f"/chat/conversations/{conv_id}/messages", headers=admin_headers)
    assert admin_messages.status_code == 403, "Admin must not access messages endpoint"

    admin_send = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Admin trying to inject message"},
        headers=admin_headers,
    )
    assert admin_send.status_code == 403, "Admin must not send messages in private conversation"

    # 4. VIOLATION REPORTING: Candidate reports conversation
    report_resp = client.post(
        f"/chat/conversations/{conv_id}/report",
        json={"reason": "Nội dung tuyển dụng không đúng sự thật và có dấu hiệu gian lận."},
        headers=cand_headers,
    )
    assert report_resp.status_code == 200, report_resp.text
    report_data = report_resp.json()
    assert report_data["is_reported"] is True
    assert report_data["conversation_id"] == conv_id

    # 5. ADMIN OVERSIGHT: Admin views stats and metadata ONLY (Zero message content)
    stats_resp = client.get("/admin/chat/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_conversations"] >= 1
    assert stats["total_messages"] >= 1
    assert stats["reported_conversations"] >= 1

    admin_convs_resp = client.get("/admin/chat/conversations?is_reported=true", headers=admin_headers)
    assert admin_convs_resp.status_code == 200
    conv_list = admin_convs_resp.json()
    assert conv_list["total"] >= 1
    target_conv = next((c for c in conv_list["items"] if c["id"] == conv_id), None)
    assert target_conv is not None
    assert target_conv["candidate_name"] == "Tran Van B"
    assert target_conv["company_name"] == "SecurityInc"
    assert target_conv["message_count"] == 1
    assert target_conv["is_reported"] is True
    assert "gian lận" in target_conv["report_reason"]
    # Check that NO message content or messages list exists in metadata output
    assert "content" not in target_conv
    assert "messages" not in target_conv

    # 6. ADMIN LOCKS CONVERSATION
    lock_resp = client.post(
        f"/admin/chat/conversations/{conv_id}/lock",
        json={"is_locked": True, "reason": "Tạm khóa do có báo cáo vi phạm cần làm rõ."},
        headers=admin_headers,
    )
    assert lock_resp.status_code == 200
    assert lock_resp.json()["is_locked"] is True

    # 7. SENDING MESSAGES IS BLOCKED WHILE LOCKED
    cand_blocked = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Tin nhắn khi đang bị khóa"},
        headers=cand_headers,
    )
    assert cand_blocked.status_code == 400
    assert "tạm khóa" in cand_blocked.text

    emp_blocked = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Nhà tuyển dụng cũng không thể gửi khi bị khóa"},
        headers=emp_headers,
    )
    assert emp_blocked.status_code == 400
    assert "tạm khóa" in emp_blocked.text

    # 8. ADMIN UNLOCKS AND DISMISSES REPORT
    unlock_resp = client.post(
        f"/admin/chat/conversations/{conv_id}/lock",
        json={"is_locked": False, "reason": "Đã xử lý xong khiếu nại."},
        headers=admin_headers,
    )
    assert unlock_resp.status_code == 200
    assert unlock_resp.json()["is_locked"] is False

    dismiss_resp = client.post(
        f"/admin/chat/conversations/{conv_id}/dismiss-report",
        headers=admin_headers,
    )
    assert dismiss_resp.status_code == 200
    assert dismiss_resp.json()["is_reported"] is False

    # 9. Sending messages succeeds again after unlock
    cand_resume = client.post(
        f"/chat/conversations/{conv_id}/messages",
        json={"content": "Phòng chat đã hoạt động lại bình thường."},
        headers=cand_headers,
    )
    assert cand_resume.status_code == 201

