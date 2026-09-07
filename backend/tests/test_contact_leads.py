"""Tests for enterprise consultation contact leads flow."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.contact_lead import ContactLead


def test_submit_contact_lead_success(client: TestClient, db_session: Session):
    payload = {
        "full_name": "Trần Thị Tuyết",
        "email": "hr@vinacorp.vn",
        "phone": "0912345678",
        "company_name": "VinaCorp Group",
        "location": "hcm",
        "service_package": "enterprise",
        "notes": "Cần tư vấn tích hợp AI matching cho 50 tin tuyển dụng.",
    }

    response = client.post("/contact/leads", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["id"] is not None
    assert data["full_name"] == "Trần Thị Tuyết"
    assert data["email"] == "hr@vinacorp.vn"
    assert data["company_name"] == "VinaCorp Group"
    assert data["service_package"] == "enterprise"
    assert data["status"] == "new"

    # Verify persisted in database
    lead_in_db = db_session.get(ContactLead, data["id"])
    assert lead_in_db is not None
    assert lead_in_db.phone == "0912345678"
    assert lead_in_db.location == "hcm"


def test_list_contact_leads(client: TestClient, db_session: Session):
    # Seed 2 leads
    lead1 = ContactLead(
        full_name="Lead 1",
        email="lead1@example.com",
        phone="0901111111",
        company_name="Company 1",
        location="hanoi",
        service_package="pro",
        status="new",
    )
    lead2 = ContactLead(
        full_name="Lead 2",
        email="lead2@example.com",
        phone="0902222222",
        company_name="Company 2",
        location="danang",
        service_package="free",
        status="new",
    )
    db_session.add_all([lead1, lead2])
    db_session.commit()

    response = client.get("/contact/leads")
    assert response.status_code == 200
    leads = response.json()
    assert len(leads) >= 2
    emails = [item["email"] for item in leads]
    assert "lead1@example.com" in emails
    assert "lead2@example.com" in emails


def test_submit_contact_lead_validation_error(client: TestClient):
    # Missing required company_name and invalid email
    payload = {
        "full_name": "Nguyễn Văn B",
        "email": "invalid-email",
        "phone": "0988888888",
    }
    response = client.post("/contact/leads", json=payload)
    assert response.status_code == 422
