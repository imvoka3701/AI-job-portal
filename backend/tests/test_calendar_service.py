"""Tests for Calendar Service: RFC 5545 iCalendar (.ics) and 1-click Google Calendar links."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.interview_round import InterviewRound
from app.models.user import User
from app.services.calendar_service import (
    escape_ics_text,
    format_ics_datetime,
    generate_google_calendar_url,
    generate_ics_calendar,
    get_calendar_links,
)


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str,
    full_name: str = "Test User",
    role: str = "candidate",
    company_name: str | None = None,
) -> dict[str, str]:
    payload: dict = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    ip_suffix = abs(hash(email)) % 240 + 1
    headers = {"X-Forwarded-For": f"10.99.3.{ip_suffix}"}
    resp = client.post("/auth/register", json=payload, headers=headers)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()
    if role == "employer":
        user = db_session.query(User).filter(User.id == user_data["id"]).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()
    login_resp = client.post(
        "/auth/login", json={"email": email, "password": password}, headers=headers
    )
    assert login_resp.status_code == 200, login_resp.text
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


def _create_job(client: TestClient, emp_headers: dict[str, str]) -> int:
    resp = client.post(
        "/jobs",
        json={
            "title": "Senior AI Engineer",
            "description": "Building next-generation intelligent matching algorithms and microservices.",
            "requirements": "Python, FastAPI, PyTorch, pgvector",
            "benefits": "Competitive salary, remote options",
            "job_type": "full_time",
            "experience_level": "senior",
            "location": "Hanoi, Vietnam",
        },
        headers=emp_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_escape_ics_text():
    """Verify RFC 5545 special character escaping."""
    assert escape_ics_text(None) == ""
    assert escape_ics_text("") == ""
    assert escape_ics_text("Hello World") == "Hello World"
    # Backslash, semicolon, comma, newlines
    raw = "Line 1, with comma; and semicolon\\backslash\nLine 2"
    escaped = escape_ics_text(raw)
    assert "\\," in escaped
    assert "\\;" in escaped
    assert "\\\\" in escaped
    assert "\\n" in escaped


def test_format_ics_datetime():
    """Verify UTC datetime format string."""
    dt_utc = datetime(2026, 9, 15, 9, 30, 0, tzinfo=timezone.utc)
    assert format_ics_datetime(dt_utc) == "20260915T093000Z"


def test_calendar_service_unit(db_session: Session, client: TestClient):
    """Test calendar generation with mock interview round."""
    emp_headers = _register_and_login(
        client, db_session, "emp_cal@test.com", "Password123!", role="employer", company_name="TechCorp"
    )
    cand_headers = _register_and_login(
        client, db_session, "cand_cal@test.com", "Password123!", role="candidate", full_name="Nguyen Van A"
    )

    job_id = _create_job(client, emp_headers)

    app_resp = client.post("/applications", json={"job_id": job_id}, headers=cand_headers)
    assert app_resp.status_code == 201, app_resp.text
    app_id = app_resp.json()["id"]

    sched_time = datetime.now(timezone.utc) + timedelta(days=2)
    round_resp = client.post(
        f"/applications/{app_id}/rounds",
        json={"round_type": "tech", "round_name": "Phỏng vấn Kỹ thuật"},
        headers=emp_headers,
    )
    assert round_resp.status_code == 201
    round_id = round_resp.json()["id"]

    # Update schedule & location
    patch_resp = client.patch(
        f"/applications/rounds/{round_id}",
        json={
            "scheduled_at": sched_time.isoformat(),
            "location": "https://meet.google.com/abc-defg-hij",
            "notes": "Chuẩn bị laptop và mã nguồn dự án",
        },
        headers=emp_headers,
    )
    assert patch_resp.status_code == 200

    round_obj = db_session.query(InterviewRound).filter(InterviewRound.id == round_id).first()
    assert round_obj is not None

    # 1. Test generate_ics_calendar
    ics = generate_ics_calendar(round_obj, duration_minutes=45)
    assert "BEGIN:VCALENDAR" in ics
    assert "VERSION:2.0" in ics
    assert "BEGIN:VEVENT" in ics
    assert f"UID:interview-round-{round_id}" in ics
    assert "Senior AI Engineer" in ics
    assert "https://meet.google.com/abc-defg-hij" in ics
    assert "END:VEVENT" in ics
    assert "END:VCALENDAR" in ics
    assert "\r\n" in ics

    # 2. Test generate_google_calendar_url
    gcal_url = generate_google_calendar_url(round_obj, duration_minutes=45)
    assert "https://calendar.google.com/calendar/render" in gcal_url
    assert "action=TEMPLATE" in gcal_url
    assert "Senior" in gcal_url

    # 3. Test get_calendar_links
    links = get_calendar_links(round_obj, duration_minutes=45)
    assert links["round_id"] == round_id
    assert links["duration_minutes"] == 45
    assert links["google_calendar_url"] == gcal_url
    assert f"/api/applications/rounds/{round_id}/calendar.ics" in links["ics_download_url"]


def test_calendar_endpoints_api(db_session: Session, client: TestClient):
    """Test GET /calendar.ics and GET /calendar-links endpoints with authorization."""
    emp_headers = _register_and_login(
        client, db_session, "emp_api@test.com", "Password123!", role="employer", company_name="AI Corp"
    )
    cand_headers = _register_and_login(
        client, db_session, "cand_api@test.com", "Password123!", role="candidate", full_name="Tran Thi B"
    )
    other_headers = _register_and_login(
        client, db_session, "other_cand@test.com", "Password123!", role="candidate", full_name="Lê Van C"
    )

    job_id = _create_job(client, emp_headers)

    app_resp = client.post("/applications", json={"job_id": job_id}, headers=cand_headers)
    assert app_resp.status_code == 201
    app_id = app_resp.json()["id"]

    sched_time = datetime.now(timezone.utc) + timedelta(days=3)
    round_resp = client.post(
        f"/applications/{app_id}/rounds",
        json={"round_type": "hr", "round_name": "Phỏng vấn Văn hóa"},
        headers=emp_headers,
    )
    assert round_resp.status_code == 201
    round_id = round_resp.json()["id"]

    # 1. Test un-scheduled round -> 400 Bad Request
    ics_err = client.get(f"/applications/rounds/{round_id}/calendar.ics", headers=cand_headers)
    assert ics_err.status_code == 400

    # Schedule the round
    patch_resp = client.patch(
        f"/applications/rounds/{round_id}",
        json={
            "scheduled_at": sched_time.isoformat(),
            "location": "Phòng họp A2, Tầng 10, Tòa nhà AI",
        },
        headers=emp_headers,
    )
    assert patch_resp.status_code == 200

    # 2. Candidate downloads .ics -> 200 OK with text/calendar
    ics_resp = client.get(f"/applications/rounds/{round_id}/calendar.ics", headers=cand_headers)
    assert ics_resp.status_code == 200
    assert "text/calendar" in ics_resp.headers["content-type"]
    assert f'filename="interview_round_{round_id}.ics"' in ics_resp.headers["content-disposition"]
    assert "BEGIN:VCALENDAR" in ics_resp.text
    assert "Phòng họp A2" in ics_resp.text

    # 3. Candidate gets calendar links -> 200 OK
    links_resp = client.get(f"/applications/rounds/{round_id}/calendar-links", headers=cand_headers)
    assert links_resp.status_code == 200
    data = links_resp.json()
    assert data["round_id"] == round_id
    assert "google_calendar_url" in data
    assert "https://calendar.google.com" in data["google_calendar_url"]

    # 4. Employer also has access to .ics -> 200 OK
    emp_ics = client.get(f"/applications/rounds/{round_id}/calendar.ics", headers=emp_headers)
    assert emp_ics.status_code == 200

    # 5. Unauthorized other candidate -> 403 Forbidden
    forbidden_resp = client.get(
        f"/applications/rounds/{round_id}/calendar.ics", headers=other_headers
    )
    assert forbidden_resp.status_code == 403
