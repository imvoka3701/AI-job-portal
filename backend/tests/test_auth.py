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
