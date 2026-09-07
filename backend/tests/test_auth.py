"""Tests for auth endpoints — register and login."""

from fastapi.testclient import TestClient


class TestRegister:
    def test_register_candidate(self, client: TestClient):
        """Test successful candidate registration."""
        response = client.post(
            "/auth/register",
            json={
                "email": "candidate@example.com",
                "password": "StrongPass123!",
                "full_name": "Nguyen Van A",
                "role": "candidate",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "candidate@example.com"
        assert data["role"] == "candidate"

    def test_register_duplicate_email(self, client: TestClient):
        """Test registration with existing email returns 409."""
        payload = {
            "email": "dup@example.com",
            "password": "StrongPass123!",
            "full_name": "Test User",
        }
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 409

    def test_cannot_register_as_admin(self, client: TestClient):
        """Security: Verify that self-registration as admin is strictly blocked."""
        response = client.post(
            "/auth/register",
            json={
                "email": "hacker_admin@example.com",
                "password": "StrongPass123!",
                "full_name": "Malicious User",
                "role": "admin",
            },
        )
        assert response.status_code == 422
        assert "Không thể tự đăng ký tài khoản Quản trị viên" in response.text



class TestLogin:
    def test_login_success(self, client: TestClient):
        """Test successful login returns JWT token."""
        # Register first
        client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "password": "StrongPass123!",
                "full_name": "Login User",
            },
        )
        # Login
        response = client.post(
            "/auth/login",
            json={"email": "login@example.com", "password": "StrongPass123!"},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_invalid_password(self, client: TestClient):
        """Test login with wrong password returns 401."""
        response = client.post(
            "/auth/login",
            json={"email": "nobody@example.com", "password": "wrong"},
        )
        assert response.status_code == 401


class TestOAuthStateAndCSRF:
    """Security tests for Google OAuth CSRF state verification and token redirect."""

    def test_sign_and_verify_oauth_state(self):
        """Test HMAC signing and verification of OAuth state."""
        import time

        from app.services.oauth_service import sign_oauth_state, verify_oauth_state

        raw_state = "secure_random_state_val"
        signed = sign_oauth_state(raw_state)

        # Valid state
        assert verify_oauth_state(signed, raw_state) is True

        # Mismatched query state
        assert verify_oauth_state(signed, "attacker_state") is False

        # Tampered signature
        tampered_sig = signed[:-4] + "abcd"
        assert verify_oauth_state(tampered_sig, raw_state) is False

        # Tampered raw_state inside cookie
        parts = signed.split(":")
        tampered_cookie = f"other_state:{parts[1]}:{parts[2]}"
        assert verify_oauth_state(tampered_cookie, "other_state") is False

        # Expired timestamp
        old_ts = str(int(time.time()) - 400)
        import hashlib
        import hmac

        from app.config import settings
        payload = f"{raw_state}:{old_ts}"
        sig = hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        expired_cookie = f"{raw_state}:{old_ts}:{sig}"
        assert verify_oauth_state(expired_cookie, raw_state) is False

        # Missing values
        assert verify_oauth_state(None, raw_state) is False
        assert verify_oauth_state(signed, None) is False

    def test_google_login_not_configured(self, client: TestClient, monkeypatch):
        """When GOOGLE_CLIENT_ID is not configured, endpoint returns 501."""
        from app.config import settings
        monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "")
        response = client.get("/auth/google/login", follow_redirects=False)
        assert response.status_code == 501

    def test_google_login_sets_state_cookie(self, client: TestClient, monkeypatch):
        """Initiating OAuth login must redirect with state and set signed oauth_state cookie."""
        from app.config import settings
        from app.services.oauth_service import oauth_service, verify_oauth_state

        monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "mock-client-id")
        monkeypatch.setattr(
            oauth_service,
            "get_authorization_url",
            lambda: ("https://accounts.google.com/o/oauth2/v2/auth?state=gen_state_123", "gen_state_123"),
        )

        response = client.get("/auth/google/login", follow_redirects=False)
        assert response.status_code == 302
        assert "accounts.google.com" in response.headers["location"]
        assert "oauth_state" in response.cookies

        # Verify cookie value
        cookie_val = response.cookies["oauth_state"]
        assert verify_oauth_state(cookie_val, "gen_state_123") is True

    def test_google_callback_rejects_missing_or_invalid_state(self, client: TestClient):
        """Callback must return 400 if state parameter or cookie is missing/invalid."""
        from app.services.oauth_service import sign_oauth_state

        # Case 1: Missing both state and cookie
        res1 = client.get("/auth/google/callback?code=mock_code", follow_redirects=False)
        assert res1.status_code == 400
        assert "State token không hợp lệ" in res1.text

        # Case 2: State query provided, but no cookie
        res2 = client.get("/auth/google/callback?code=mock_code&state=xyz", follow_redirects=False)
        assert res2.status_code == 400

        # Case 3: Cookie provided, but state query missing
        signed = sign_oauth_state("xyz")
        client.cookies.set("oauth_state", signed)
        res3 = client.get("/auth/google/callback?code=mock_code", follow_redirects=False)
        assert res3.status_code == 400

        # Case 4: State mismatch (CSRF attack attempt)
        res4 = client.get("/auth/google/callback?code=mock_code&state=attacker_state", follow_redirects=False)
        assert res4.status_code == 400

    def test_google_callback_success_redirects_with_fragment_and_clears_cookie(
        self, client: TestClient, monkeypatch
    ):
        """Valid state exchanges code and redirects to frontend using URL fragment (#token=...)."""
        from unittest.mock import AsyncMock

        from app.services.oauth_service import oauth_service, sign_oauth_state

        valid_state = "valid_secure_state"
        signed_cookie = sign_oauth_state(valid_state)

        fake_redirect_url = (
            "http://localhost:5173/auth/google/callback#token=mock_jwt_token&redirect=/dashboard"
        )
        monkeypatch.setattr(
            oauth_service,
            "handle_callback",
            AsyncMock(return_value=("mock_jwt_token", fake_redirect_url)),
        )

        client.cookies.set("oauth_state", signed_cookie)
        response = client.get(
            f"/auth/google/callback?code=valid_google_code&state={valid_state}",
            follow_redirects=False,
        )

        assert response.status_code == 302
        assert response.headers["location"] == fake_redirect_url
        assert "#token=mock_jwt_token" in response.headers["location"]
        # Cookie should be deleted
        set_cookie_header = response.headers.get("set-cookie", "")
        assert "oauth_state=" in set_cookie_header
        assert "Max-Age=0" in set_cookie_header or "expires=" in set_cookie_header

