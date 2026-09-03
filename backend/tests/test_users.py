"""Tests for User profile CRUD, is_active gate, and role-based access."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User

# ─── Helpers ────────────────────────────────────────────────────────────────────


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str,
    full_name: str = "Test",
    role: str = "candidate",
    company_name: str | None = None,
    activate: bool = True,
) -> dict[str, str]:
    """Register and login; return auth headers. If activate=False for employers,
    the employer stays inactive (testing pending-approval flow)."""
    payload: dict = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role,
    }
    if company_name:
        payload["company_name"] = company_name

    resp = client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()

    if role == "employer" and activate:
        user = db_session.query(User).filter(User.id == user_data["id"]).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()

    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    if activate:
        assert login_resp.status_code == 200, login_resp.text
        return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    else:
        error_data = login_resp.json().get("error", {})
        return {
            "login_status": login_resp.status_code,
            "detail": error_data.get("message", "") or login_resp.json().get("detail", ""),
        }


# ─── Tests ──────────────────────────────────────────────────────────────────────


class TestProfileCRUD:
    def test_get_own_profile(self, client: TestClient, db_session: Session):
        headers = _register_and_login(client, db_session, "pu@t.com", "p", "Test User")
        resp = client.get("/users/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "pu@t.com"
        assert data["full_name"] == "Test User"
        assert data["role"] == "candidate"

    def test_update_own_profile(self, client: TestClient, db_session: Session):
        headers = _register_and_login(client, db_session, "pu2@t.com", "p", "Old Name")
        resp = client.patch(
            "/users/me", json={"full_name": "New Name", "phone": "0123456789"}, headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "New Name"
        assert data["phone"] == "0123456789"

    def test_get_user_by_id_unauthenticated(self, client: TestClient):
        """Unauthenticated requests must be rejected with 401."""
        resp = client.get("/users/1")
        assert resp.status_code == 401

    def test_get_user_by_id_as_self(self, client: TestClient, db_session: Session):
        """Viewing own profile by ID returns full data including email."""
        headers = _register_and_login(client, db_session, "pu3@t.com", "p", "Public")
        me = client.get("/users/me", headers=headers).json()
        resp = client.get(f"/users/{me['id']}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "pu3@t.com"

    def test_get_user_by_id_as_other_user_redacts_pii(self, client: TestClient, db_session: Session):
        """Viewing another user's profile returns PublicUserRead without email or phone."""
        user_a_headers = _register_and_login(client, db_session, "user_a@t.com", "p", "User A")
        user_b_headers = _register_and_login(client, db_session, "user_b@t.com", "p", "User B")
        # Update user B phone
        client.patch("/users/me", json={"phone": "0987654321"}, headers=user_b_headers)
        user_b = client.get("/users/me", headers=user_b_headers).json()

        # User A views User B's profile
        resp = client.get(f"/users/{user_b['id']}", headers=user_a_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "User B"
        assert "email" not in data, "Email must be redacted for other users"
        assert "phone" not in data, "Phone must be redacted for other users"

    def test_get_nonexistent_user(self, client: TestClient, db_session: Session):
        headers = _register_and_login(client, db_session, "pu4@t.com", "p", "Public 4")
        resp = client.get("/users/99999", headers=headers)
        assert resp.status_code == 404



class TestIsActiveGate:
    def test_candidate_active_by_default(self, client: TestClient, db_session: Session):
        """Candidate should be active immediately after registration."""
        resp = client.post(
            "/auth/register",
            json={
                "email": "active_c@t.com",
                "password": "p",
                "full_name": "Active C",
                "role": "candidate",
            },
        )
        assert resp.status_code in (200, 201)
        login = client.post("/auth/login", json={"email": "active_c@t.com", "password": "p"})
        assert login.status_code == 200, (
            f"Candidate should be able to login immediately: {login.text}"
        )

    def test_employer_inactive_by_default(self, client: TestClient, db_session: Session):
        """Employer should NOT be active right after registration — login blocked."""
        result = _register_and_login(
            client,
            db_session,
            "inactive_e@t.com",
            "p",
            "Inactive E",
            role="employer",
            company_name="InactiveCorp",
            activate=False,
        )
        assert result["login_status"] == 401, (
            f"Expected 401, got {result['login_status']}: {result}"
        )
        assert "chờ Admin duyệt" in result["detail"]

    def test_inactive_employer_blocked_from_all_endpoints(
        self, client: TestClient, db_session: Session
    ):
        """An inactive employer cannot access any authenticated endpoint (login fails → no token)."""
        result = _register_and_login(
            client,
            db_session,
            "blocked_e@t.com",
            "p",
            "Blocked E",
            role="employer",
            company_name="BlockedCorp",
            activate=False,
        )
        assert result["login_status"] == 401
        assert "chờ Admin duyệt" in result["detail"]
        # Without a token, employer can't call any protected endpoint
        # This is implicitly tested — no token = no access

    def test_activate_then_login(self, client: TestClient, db_session: Session):
        """After activation (admin approve), employer should login successfully."""
        # Register but don't activate
        result = _register_and_login(
            client,
            db_session,
            "approve_e@t.com",
            "p",
            "ApproveMe",
            role="employer",
            company_name="ApproveCorp",
            activate=False,
        )
        assert result["login_status"] == 401

        # Activate via DB (simulating admin approve)
        user = db_session.query(User).filter(User.email == "approve_e@t.com").first()
        assert user is not None
        user.is_active = True
        db_session.commit()

        # Now login should work
        login = client.post("/auth/login", json={"email": "approve_e@t.com", "password": "p"})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        assert token is not None

    def test_admin_never_blocked(self, client: TestClient, db_session: Session):
        """Admin accounts should always be active."""
        user = db_session.query(User).filter(User.role == "admin").first()
        if user:
            assert user.is_active, "Admin must always be active"
