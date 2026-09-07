"""Tests for forgot password and temporary password delivery flow."""

from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole


def test_forgot_password_success(client: TestClient, db_session: Session):
    # 1. Seed user with known old password
    user = User(
        email="candidate_test@example.com",
        hashed_password=hash_password("OldPassword123!"),
        full_name="Nguyễn Văn A",
        role=UserRole.CANDIDATE,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    old_hash = user.hashed_password

    # 2. Call forgot-password endpoint
    with patch("app.services.password_reset_service.password_reset_service.send_new_password") as mock_send:
        mock_send.return_value = True
        response = client.post(
            "/auth/forgot-password",
            json={"email": "candidate_test@example.com"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "candidate_test@example.com"
        assert "Mật khẩu mới đã được gửi" in data["message"]

        # Verify mock called
        assert mock_send.called
        kwargs = mock_send.call_args.kwargs
        assert kwargs["email"] == "candidate_test@example.com"
        assert kwargs["full_name"] == "Nguyễn Văn A"
        new_password_sent = kwargs["new_password"]
        assert len(new_password_sent) >= 8

    # 3. Verify user in DB has updated hash that matches the new temporary password
    db_session.refresh(user)
    assert user.hashed_password != old_hash
    assert verify_password(new_password_sent, user.hashed_password)
    assert not verify_password("OldPassword123!", user.hashed_password)

    # 4. Verify user can log in with the new password
    login_resp = client.post(
        "/auth/login",
        json={"email": "candidate_test@example.com", "password": new_password_sent},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_forgot_password_user_not_found(client: TestClient):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )
    assert response.status_code == 404
    assert "Không tìm thấy tài khoản" in response.json()["error"]["message"]


def test_forgot_password_invalid_email(client: TestClient):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "not-an-email"},
    )
    assert response.status_code == 422
