"""Tests for employer settings endpoints — GET/PATCH /employer/settings."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.company import crud_company
from app.crud.user import crud_user

PASSWORD = "StrongPass123!"


def _register_approved_employer(
    client: TestClient,
    db: Session,
    *,
    email: str = "owner@example.com",
    company_name: str = "SettingsCorp",
) -> dict[str, str]:
    """Register an employer, approve them, and return auth headers."""
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Settings Owner",
            "role": "employer",
            "company_name": company_name,
        },
    )
    assert response.status_code == 201
    user = crud_user.get_by_email(db, email=email)
    assert user is not None
    membership = crud_company.get_active_membership(db, user_id=user.id)
    assert membership is not None
    user.is_active = True
    membership.company.is_active = True
    db.commit()
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


class TestGetSettings:
    def test_get_settings_returns_company_profile(self, client: TestClient, db_session: Session):
        """Test GET /employer/settings returns the company profile."""
        headers = _register_approved_employer(client, db_session)
        response = client.get("/employer/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "SettingsCorp"
        assert "id" in data
        assert "description" in data

    def test_get_settings_unauthenticated(self, client: TestClient):
        """Test unauthenticated request is rejected."""
        response = client.get("/employer/settings")
        assert response.status_code == 401

    def test_get_settings_candidate_forbidden(self, client: TestClient, db_session: Session):
        """Test candidate role cannot access employer settings."""
        client.post(
            "/auth/register",
            json={
                "email": "cand@example.com",
                "password": PASSWORD,
                "full_name": "Cand",
                "role": "candidate",
            },
        )
        login = client.post(
            "/auth/login",
            json={"email": "cand@example.com", "password": PASSWORD},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        response = client.get("/employer/settings", headers=headers)
        assert response.status_code in (403, 422)


class TestUpdateSettings:
    def test_patch_updates_company_profile(self, client: TestClient, db_session: Session):
        """Test PATCH /employer/settings updates fields."""
        headers = _register_approved_employer(client, db_session)
        response = client.patch(
            "/employer/settings",
            json={
                "name": "NewCorp Name",
                "description": "Updated description",
                "website": "https://newcorp.vn",
                "address": "123 Main St",
                "tax_code": "1234567890",
                "industry": "Fintech",
                "company_size": "50-100",
                "contact_person_name": "Nguyen Van A",
                "contact_person_email": "contact@newcorp.vn",
                "contact_person_phone": "0901234567",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "NewCorp Name"
        assert data["description"] == "Updated description"
        assert data["website"] == "https://newcorp.vn"
        assert data["tax_code"] == "1234567890"
        assert data["contact_person_name"] == "Nguyen Van A"

    def test_patch_partial_update(self, client: TestClient, db_session: Session):
        """Test PATCH with only some fields updates just those fields."""
        headers = _register_approved_employer(client, db_session)
        response = client.patch(
            "/employer/settings",
            json={"description": "Only description changed"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["description"] == "Only description changed"
        assert response.json()["name"] == "SettingsCorp"  # unchanged

    def test_patch_persists_after_get(self, client: TestClient, db_session: Session):
        """Test that PATCH changes are visible in subsequent GET."""
        headers = _register_approved_employer(client, db_session)
        client.patch(
            "/employer/settings",
            json={"website": "https://persistent.vn"},
            headers=headers,
        )
        get_response = client.get("/employer/settings", headers=headers)
        assert get_response.json()["website"] == "https://persistent.vn"

    def test_patch_empty_body_returns_400(self, client: TestClient, db_session: Session):
        """Test PATCH with no fields returns 400."""
        headers = _register_approved_employer(client, db_session)
        response = client.patch("/employer/settings", json={}, headers=headers)
        assert response.status_code == 400
