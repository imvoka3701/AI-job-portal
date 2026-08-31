"""Recruitment-request workflow and invitation delivery tests."""

from types import SimpleNamespace

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.company import crud_company
from app.crud.user import crud_user
from app.models.company import InvitationDeliveryStatus
from app.services.invitation_email_service import (
    InvitationDeliveryResult,
    InvitationEmailService,
    invitation_email_service,
)

PASSWORD = "StrongPass123!"


def _approved_employer(
    client: TestClient,
    db: Session,
    *,
    email: str,
    company_name: str,
) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Employer Owner",
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
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _company_with_head(
    client: TestClient,
    db: Session,
    *,
    suffix: str,
) -> tuple[dict[str, str], dict[str, str], int]:
    owner_headers = _approved_employer(
        client,
        db,
        email=f"owner-{suffix}@example.com",
        company_name=f"Company {suffix}",
    )
    department = client.post(
        "/employer/departments",
        headers=owner_headers,
        json={"name": "Engineering"},
    ).json()
    invitation = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={
            "email": f"head-{suffix}@example.com",
            "member_role": "department_head",
            "department_id": department["id"],
        },
    ).json()
    accepted = client.post(
        f"/employer/invitations/{invitation['invite_token']}/accept",
        json={"full_name": "Engineering Head", "password": PASSWORD},
    )
    assert accepted.status_code == 200
    login = client.post(
        "/auth/login",
        json={"email": f"head-{suffix}@example.com", "password": PASSWORD},
    )
    head_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    return owner_headers, head_headers, department["id"]


def _request_payload(*, submit: bool = False) -> dict:
    return {
        "title": "Senior Backend Engineer",
        "headcount": 2,
        "job_type": "full_time",
        "priority": "high",
        "reason": "Mở rộng đội ngũ để triển khai nền tảng tuyển dụng mới.",
        "responsibilities": "Thiết kế và vận hành các dịch vụ backend có độ tin cậy cao.",
        "requirements": "Có kinh nghiệm Python, FastAPI, PostgreSQL và thiết kế hệ thống.",
        "target_start_date": "2026-10-01",
        "submit": submit,
    }


def test_recruitment_request_full_workflow_and_job_conversion(
    client: TestClient,
    db_session: Session,
    monkeypatch,
):
    owner_headers, head_headers, department_id = _company_with_head(
        client, db_session, suffix="workflow"
    )
    head_context = client.get("/employer/company-context", headers=head_headers).json()
    assert "recruitment_request:create" in head_context["permissions"]
    assert "recruitment_request:review" not in head_context["permissions"]

    created = client.post(
        "/employer/recruitment-requests",
        headers=head_headers,
        json=_request_payload(),
    )
    assert created.status_code == 201, created.text
    request_id = created.json()["id"]
    assert created.json()["status"] == "draft"
    assert created.json()["department_id"] == department_id

    assert (
        client.post(
            f"/employer/recruitment-requests/{request_id}/review",
            headers=head_headers,
            json={"decision": "approved"},
        ).status_code
        == 403
    )

    submitted = client.post(
        f"/employer/recruitment-requests/{request_id}/submit",
        headers=head_headers,
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "submitted"

    owner_context = client.get("/employer/company-context", headers=owner_headers).json()
    assert "recruitment_request:review" in owner_context["permissions"]
    assert "recruitment_request:create" not in owner_context["permissions"]
    assert (
        client.post(
            "/employer/recruitment-requests",
            headers=owner_headers,
            json=_request_payload(),
        ).status_code
        == 403
    )

    approved = client.post(
        f"/employer/recruitment-requests/{request_id}/review",
        headers=owner_headers,
        json={"decision": "approved", "note": "Đã xác nhận ngân sách quý 4."},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"

    monkeypatch.setattr("app.routers.jobs.generate_embedding", lambda _text: [0.0] * 384)
    job_payload = {
        "title": approved.json()["title"],
        "description": approved.json()["responsibilities"],
        "requirements": approved.json()["requirements"],
        "department_id": department_id,
        "recruitment_request_id": request_id,
    }
    converted = client.post("/jobs", headers=owner_headers, json=job_payload)
    assert converted.status_code == 201, converted.text
    request_after = client.get(
        f"/employer/recruitment-requests/{request_id}", headers=owner_headers
    ).json()
    assert request_after["converted_job_id"] == converted.json()["id"]
    assert client.post("/jobs", headers=owner_headers, json=job_payload).status_code == 409


def test_recruitment_request_rejection_resubmit_and_tenant_isolation(
    client: TestClient,
    db_session: Session,
):
    owner_headers, head_headers, _ = _company_with_head(client, db_session, suffix="review")
    foreign_headers = _approved_employer(
        client,
        db_session,
        email="foreign-request@example.com",
        company_name="Foreign Company",
    )
    created = client.post(
        "/employer/recruitment-requests",
        headers=head_headers,
        json=_request_payload(submit=True),
    ).json()

    missing_note = client.post(
        f"/employer/recruitment-requests/{created['id']}/review",
        headers=owner_headers,
        json={"decision": "rejected"},
    )
    assert missing_note.status_code == 422
    rejected = client.post(
        f"/employer/recruitment-requests/{created['id']}/review",
        headers=owner_headers,
        json={"decision": "rejected", "note": "Cần làm rõ phạm vi trách nhiệm."},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"

    edited = client.patch(
        f"/employer/recruitment-requests/{created['id']}",
        headers=head_headers,
        json={"reason": "Mở rộng đội ngũ theo kế hoạch đã được cập nhật và xác nhận."},
    )
    assert edited.status_code == 200
    assert edited.json()["status"] == "draft"
    assert (
        client.post(
            f"/employer/recruitment-requests/{created['id']}/submit",
            headers=head_headers,
        ).json()["status"]
        == "submitted"
    )

    assert (
        client.get(
            f"/employer/recruitment-requests/{created['id']}", headers=foreign_headers
        ).status_code
        == 404
    )
    assert (
        client.get("/employer/recruitment-requests", headers=foreign_headers).json()["total"] == 0
    )


def test_invitation_delivery_tracking_failure_retry_and_bounce(
    client: TestClient,
    db_session: Session,
    monkeypatch,
):
    owner_headers = _approved_employer(
        client,
        db_session,
        email="smtp-owner@example.com",
        company_name="SMTP Company",
    )
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.test")
    monkeypatch.setattr(settings, "SMTP_FROM_EMAIL", "no-reply@example.test")
    monkeypatch.setattr(settings, "EMAIL_BOUNCE_WEBHOOK_SECRET", "bounce-secret")
    monkeypatch.setattr(
        invitation_email_service,
        "send",
        lambda *_args, **_kwargs: InvitationDeliveryResult(
            InvitationDeliveryStatus.FAILED,
            message_id="<failed@example.test>",
            error="SMTP test failure",
        ),
    )
    created = client.post(
        "/employer/team/invitations",
        headers=owner_headers,
        json={"email": "delivery@example.com", "member_role": "hr"},
    )
    assert created.status_code == 201, created.text
    assert created.json()["delivery_status"] == "failed"
    assert created.json()["delivery_attempts"] == 1

    monkeypatch.setattr(
        invitation_email_service,
        "send",
        lambda *_args, **_kwargs: InvitationDeliveryResult(
            InvitationDeliveryStatus.SENT,
            message_id="<sent@example.test>",
        ),
    )
    resent = client.post(
        f"/employer/team/invitations/{created.json()['id']}/resend",
        headers=owner_headers,
    )
    assert resent.status_code == 200
    assert resent.json()["delivery_status"] == "sent"
    assert resent.json()["delivery_attempts"] == 2

    unauthorized = client.post(
        "/webhooks/email/invitation-bounce",
        headers={"X-Webhook-Secret": "wrong"},
        json={"message_id": "<sent@example.test>", "reason": "Mailbox unavailable"},
    )
    assert unauthorized.status_code == 401
    bounced = client.post(
        "/webhooks/email/invitation-bounce",
        headers={"X-Webhook-Secret": "bounce-secret"},
        json={"message_id": "<sent@example.test>", "reason": "Mailbox unavailable"},
    )
    assert bounced.status_code == 202
    invitation = client.get("/employer/team/invitations", headers=owner_headers).json()[0]
    assert invitation["delivery_status"] == "bounced"
    assert invitation["delivery_error"] == "Mailbox unavailable"


def test_invitation_email_service_sends_structured_message(monkeypatch):
    calls: dict[str, object] = {}

    class FakeSMTP:
        def __init__(self, host, port, *, timeout):
            calls["connection"] = (host, port, timeout)

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def starttls(self):
            calls["starttls"] = True

        def login(self, username, password):
            calls["login"] = (username, password)

        def send_message(self, message):
            calls["message"] = message
            return {}

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.test")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "smtp-user")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "smtp-password")
    monkeypatch.setattr(settings, "SMTP_FROM_EMAIL", "no-reply@example.test")
    monkeypatch.setattr(settings, "SMTP_FROM_NAME", "AI Job Portal")
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)
    monkeypatch.setattr(settings, "SMTP_USE_SSL", False)
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://localhost:3000")
    monkeypatch.setattr("app.services.invitation_email_service.smtplib.SMTP", FakeSMTP)

    invitation = SimpleNamespace(
        id=42,
        email="new-hr@example.test",
        member_role=SimpleNamespace(value="hr"),
        department=SimpleNamespace(name="People Operations"),
        company=SimpleNamespace(name="Example Company"),
    )
    result = InvitationEmailService().send(invitation, token="one-time-token")

    assert result.status == InvitationDeliveryStatus.SENT
    assert result.message_id
    assert calls["connection"] == ("smtp.example.test", 587, settings.SMTP_TIMEOUT_SECONDS)
    assert calls["starttls"] is True
    assert calls["login"] == ("smtp-user", "smtp-password")
    message = calls["message"]
    assert message["To"] == "new-hr@example.test"
    assert message["Message-ID"] == result.message_id
    assert (
        "http://localhost:3000/employer/invitations/one-time-token/accept"
        in message.get_body(preferencelist=("plain",)).get_content()
    )
