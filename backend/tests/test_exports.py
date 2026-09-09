"""Unit & Integration tests for Module 3.4: Enterprise Data Export & Reporting."""

from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.export_service import UTF8_BOM


def _register_and_login(
    client: TestClient,
    db_session: Session,
    email: str,
    password: str = "Password123!",
    full_name: str = "Test User",
    role: str = "candidate",
    company_name: str | None = None,
) -> tuple[dict[str, str], int]:
    payload: dict = {"email": email, "password": password, "full_name": full_name, "role": role}
    if company_name:
        payload["company_name"] = company_name
    ip_suffix = abs(hash(email)) % 240 + 1
    headers = {"X-Forwarded-For": f"10.99.4.{ip_suffix}"}
    resp = client.post("/auth/register", json=payload, headers=headers)
    assert resp.status_code in (200, 201), resp.text
    user_data = resp.json()
    user_id = user_data["id"]

    if role == "employer":
        user = db_session.query(User).filter(User.id == user_id).first()
        if user and not user.is_active:
            user.is_active = True
            db_session.commit()

    login_resp = client.post("/auth/login", json={"email": email, "password": password}, headers=headers)
    assert login_resp.status_code == 200, login_resp.text
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}, user_id


def test_export_candidates_csv_flow(client: TestClient, db_session: Session) -> None:
    # 1. Setup Employer and Candidate
    hr_headers, _hr_id = _register_and_login(
        client, db_session, "hr_export@vng.vn", full_name="Trần Thảo (HR)", role="employer", company_name="VNG Corp"
    )
    cand_headers, _cand_id = _register_and_login(
        client, db_session, "cand_export@gmail.com", full_name="Nguyễn Văn A", role="candidate"
    )

    # 2. Employer posts job
    with patch("app.routers.jobs.generate_embedding", return_value=[0.05] * 384):
        job_resp = client.post(
            "/jobs",
            json={
                "title": "Senior AI Architect",
                "description": "Lead deep learning and vector search systems.",
                "requirements": "Python, PyTorch, pgvector",
                "benefits": "Top salary",
                "job_type": "full_time",
                "experience_level": "senior",
                "location": "TP. Hồ Chí Minh",
            },
            headers=hr_headers,
        )
    assert job_resp.status_code == 201
    job_id = job_resp.json()["id"]

    # 3. Candidate applies
    with patch("app.routers.applications._send_application_notification_task"):
        apply_resp = client.post(
            "/applications",
            json={"job_id": job_id, "cover_letter": "I have 7 years experience in AI."},
            headers=cand_headers,
        )
    assert apply_resp.status_code == 201
    app_id = apply_resp.json()["id"]

    # 4. Export Candidates CSV
    export_resp = client.get("/employer/exports/candidates.csv", headers=hr_headers)
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    assert "danh_sach_ung_vien" in export_resp.headers["content-disposition"]

    content = export_resp.text
    # Verify UTF-8 BOM is present for Excel compatibility
    assert content.startswith(UTF8_BOM), "CSV must start with UTF-8 BOM"

    # Verify expected columns and data
    assert "Mã hồ sơ" in content
    assert "Họ và tên ứng viên" in content
    assert "Nguyễn Văn A" in content
    assert "cand_export@gmail.com" in content
    assert "Senior AI Architect" in content
    assert "Chờ duyệt" in content

    # 5. Export with filters
    filter_resp = client.get(f"/employer/exports/candidates.csv?job_id={job_id}&status=pending", headers=hr_headers)
    assert filter_resp.status_code == 200
    assert "Nguyễn Văn A" in filter_resp.text

    # Negative filter (no match)
    no_match_resp = client.get(f"/employer/exports/candidates.csv?job_id={job_id}&status=rejected", headers=hr_headers)
    assert no_match_resp.status_code == 200
    assert "Nguyễn Văn A" not in no_match_resp.text


def test_export_pipeline_metrics_csv(client: TestClient, db_session: Session) -> None:
    hr_headers, _ = _register_and_login(
        client, db_session, "metrics_hr@fpt.com", full_name="Lê Minh (HR Director)", role="employer", company_name="FPT Corp"
    )

    metrics_resp = client.get("/employer/exports/pipeline-metrics.csv", headers=hr_headers)
    assert metrics_resp.status_code == 200
    assert "text/csv" in metrics_resp.headers["content-type"]
    assert "bao_cao_hieu_suat_tuyen_dung" in metrics_resp.headers["content-disposition"]

    content = metrics_resp.text
    assert content.startswith(UTF8_BOM)
    assert "BÁO CÁO TỔNG QUAN HIỆU SUẤT TUYỂN DỤNG" in content
    assert "THỐNG KÊ PHỄU ỨNG VIÊN THEO VÒNG" in content
    assert "CHI TIẾT THEO VỊ TRÍ TUYỂN DỤNG" in content


def test_export_authorization_and_security(client: TestClient, db_session: Session) -> None:
    cand_headers, _ = _register_and_login(
        client, db_session, "unauth_cand@gmail.com", full_name="Candidate Only", role="candidate"
    )

    # Candidate forbidden
    resp = client.get("/employer/exports/candidates.csv", headers=cand_headers)
    assert resp.status_code in (401, 403)

    resp_metrics = client.get("/employer/exports/pipeline-metrics.csv", headers=cand_headers)
    assert resp_metrics.status_code in (401, 403)

    # Anonymous forbidden
    resp_anon = client.get("/employer/exports/candidates.csv")
    assert resp_anon.status_code == 401
