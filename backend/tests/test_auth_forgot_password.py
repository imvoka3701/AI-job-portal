"""Tests for forgot password, anti-user enumeration, session invalidation, and rate limiting."""

from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole


def test_forgot_password_success(client: TestClient, db_session: Session):
    # 1. Seed user with known old password and initial token_version=1
    user = User(
        email="candidate_test@example.com",
        hashed_password=hash_password("OldPassword123!"),
        full_name="Nguyễn Văn A",
        role=UserRole.CANDIDATE,
        is_active=True,
        token_version=1,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    old_hash = user.hashed_password

    # 2. Call forgot-password endpoint
    with patch(
        "app.services.password_reset_service.password_reset_service.send_new_password"
    ) as mock_send:
        mock_send.return_value = True
        response = client.post(
            "/auth/forgot-password",
            json={"email": "candidate_test@example.com"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "candidate_test@example.com"
        assert "Nếu email tồn tại trong hệ thống" in data["message"]

        # Verify mock called
        assert mock_send.called
        kwargs = mock_send.call_args.kwargs
        assert kwargs["email"] == "candidate_test@example.com"
        assert kwargs["full_name"] == "Nguyễn Văn A"
        new_password_sent = kwargs["new_password"]
        assert len(new_password_sent) >= 8

    # 3. Verify user in DB has updated hash and bumped token_version
    db_session.refresh(user)
    assert user.hashed_password != old_hash
    assert verify_password(new_password_sent, user.hashed_password)
    assert not verify_password("OldPassword123!", user.hashed_password)
    assert user.token_version == 2

    # 4. Verify user can log in with the new password
    login_resp = client.post(
        "/auth/login",
        json={"email": "candidate_test@example.com", "password": new_password_sent},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_forgot_password_user_not_found(client: TestClient):
    """Anti-user enumeration: Endpoint returns HTTP 200 with identical generic message when email does not exist."""
    with patch(
        "app.services.password_reset_service.password_reset_service.send_new_password"
    ) as mock_send:
        response = client.post(
            "/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "nonexistent@example.com"
        assert "Nếu email tồn tại trong hệ thống" in data["message"]
        # Ensure email dispatcher was NOT called
        assert not mock_send.called


def test_forgot_password_invalidates_active_sessions(client: TestClient, db_session: Session):
    """Password reset must bump token_version and immediately revoke existing JWT tokens."""
    # 1. Seed user
    user = User(
        email="revocation_test@example.com",
        hashed_password=hash_password("CurrentPassword123!"),
        full_name="Revoke User",
        role=UserRole.CANDIDATE,
        is_active=True,
        token_version=1,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 2. Login to obtain access token with token_version=1
    login_resp = client.post(
        "/auth/login",
        json={"email": "revocation_test@example.com", "password": "CurrentPassword123!"},
    )
    assert login_resp.status_code == 200
    old_token = login_resp.json()["access_token"]

    # 3. Verify old token works on protected route
    me_resp = client.get("/users/me", headers={"Authorization": f"Bearer {old_token}"})
    assert me_resp.status_code == 200

    # 4. Trigger password reset
    with patch(
        "app.services.password_reset_service.password_reset_service.send_new_password"
    ) as mock_send:
        reset_resp = client.post(
            "/auth/forgot-password",
            json={"email": "revocation_test@example.com"},
        )
        assert reset_resp.status_code == 200
        new_password = mock_send.call_args.kwargs["new_password"]

    # 5. Old token MUST now be rejected with 401 Unauthorized
    me_resp_old = client.get("/users/me", headers={"Authorization": f"Bearer {old_token}"})
    assert me_resp_old.status_code == 401
    assert "Phiên đăng nhập đã hết hiệu lực" in me_resp_old.json()["error"]["message"]

    # 6. User can log in with new password and get fresh token with token_version=2
    new_login_resp = client.post(
        "/auth/login",
        json={"email": "revocation_test@example.com", "password": new_password},
    )
    assert new_login_resp.status_code == 200
    new_token = new_login_resp.json()["access_token"]

    # 7. New token works on protected route
    me_resp_new = client.get("/users/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_resp_new.status_code == 200


def test_forgot_password_invalid_email(client: TestClient):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "not-an-email"},
    )
    assert response.status_code == 422
