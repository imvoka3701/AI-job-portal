"""Tests for WebSocket Real-time Notifications: Handshake, Authentication, Ping/Pong, and Dispatch."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.services.notification_dispatcher import create_and_dispatch_notification


def _register_and_get_token(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str,
    full_name: str = "WS Test User",
    role: str = "candidate",
    company_name: str | None = None,
) -> tuple[int, str]:
    payload: dict = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    ip_suffix = abs(hash(email)) % 240 + 1
    headers = {"X-Forwarded-For": f"10.99.5.{ip_suffix}"}
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
    return user_id, login_resp.json()["access_token"]


def test_websocket_unauthorized(client: TestClient):
    """Connecting without token or with invalid token should be rejected with policy violation."""
    import pytest
    from starlette.websockets import WebSocketDisconnect

    # 1. No token
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/notifications"):
            pass
    assert exc_info.value.code == 1008

    # 2. Invalid token
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/notifications?token=invalid.jwt.token"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_connection_and_ping_pong(db_session: Session, client: TestClient):
    """Connecting with valid token receives handshake and answers ping/pong."""
    user_id, token = _register_and_get_token(
        client, db_session, "ws_ping@test.com", "Password123!", full_name="Ping Pong User"
    )

    with client.websocket_connect(f"/ws/notifications?token={token}") as ws:
        # Initial greeting
        greeting = ws.receive_json()
        assert greeting["type"] == "connection_established"
        assert greeting["user_id"] == user_id

        # Send text ping
        ws.send_text("ping")
        reply = ws.receive_text()
        assert reply == "pong"

        # Send JSON ping
        ws.send_json({"type": "ping"})
        reply_json = ws.receive_json()
        assert reply_json["type"] == "pong"


def test_websocket_realtime_notification_dispatch(db_session: Session, client: TestClient):
    """When notification is created and dispatched, connected user receives it in real-time."""
    user_id, token = _register_and_get_token(
        client, db_session, "ws_notif@test.com", "Password123!", full_name="Live Notif User"
    )

    with client.websocket_connect(f"/ws/notifications?token={token}") as ws:
        # Discard greeting
        greeting = ws.receive_json()
        assert greeting["type"] == "connection_established"

        # Dispatch notification from backend service
        notif = create_and_dispatch_notification(
            db_session,
            user_id=user_id,
            title="Đơn ứng tuyển được duyệt",
            message="Hồ sơ của bạn đã được chuyển sang vòng phỏng vấn.",
            notif_type=NotificationType.APPLICATION_UPDATE,
            extra_data={"application_id": 999},
        )

        # Receive live notification over WebSocket
        msg = ws.receive_json()
        assert msg["type"] == "notification"
        assert msg["data"]["id"] == notif.id
        assert msg["data"]["title"] == "Đơn ứng tuyển được duyệt"
        assert "vòng phỏng vấn" in msg["data"]["message"]
        assert msg["data"]["extra_data"]["application_id"] == 999

        # Verify database record was saved
        db_notif = db_session.query(Notification).filter(Notification.id == notif.id).first()
        assert db_notif is not None
        assert db_notif.user_id == user_id
