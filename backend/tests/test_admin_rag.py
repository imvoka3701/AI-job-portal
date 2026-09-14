"""Tests for Admin RAG Governance & Monitoring router."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import app
from app.models.user import User, UserRole

client = TestClient(app)


def _login_user(client: TestClient, db_session: Session, email: str, role: str) -> dict[str, str]:
    db_session.query(User).filter(User.email == email).delete()
    db_session.commit()

    if role == "admin":
        user = User(
            email=email,
            hashed_password=hash_password("password123"),
            full_name="Admin Test",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
    else:
        reg = client.post(
            "/auth/register",
            json={
                "email": email,
                "password": "password123",
                "full_name": f"Test {role.title()}",
                "role": role,
                "company_name": "TestCorp" if role == "employer" else None,
            },
        )
        assert reg.status_code in (200, 201), reg.text
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            user.is_active = True
            db_session.commit()

    login = client.post("/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_admin_rag_stats_unauthorized(client: TestClient, db_session: Session):
    headers = _login_user(client, db_session, "cand_rag_test@example.com", role="candidate")
    response = client.get("/admin/rag/stats", headers=headers)
    assert response.status_code in [401, 403]


def test_admin_rag_stats_authorized(client: TestClient, db_session: Session):
    headers = _login_user(client, db_session, "admin_rag_stats@jobportal.vn", role="admin")
    response = client.get("/admin/rag/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_chunks" in data
    assert "overall_coverage_pct" in data
    assert "hybrid_alpha_dense" in data
    assert "hybrid_alpha_sparse" in data
    assert "daily_search_trends" in data


def test_admin_rag_config_read_and_update(client: TestClient, db_session: Session):
    headers = _login_user(client, db_session, "admin_rag_config@jobportal.vn", role="admin")

    # 1. Get initial config
    res_get = client.get("/admin/rag/config", headers=headers)
    assert res_get.status_code == 200
    init_cfg = res_get.json()
    assert init_cfg["is_rag_enabled"] is True

    # 2. Update tuning weights
    update_payload = {
        "hybrid_alpha_dense": 0.80,
        "hybrid_alpha_sparse": 0.20,
        "default_min_score": 0.50,
        "default_top_k": 25,
    }
    res_patch = client.patch("/admin/rag/config", json=update_payload, headers=headers)
    assert res_patch.status_code == 200
    updated = res_patch.json()
    assert updated["hybrid_alpha_dense"] == 0.80
    assert updated["hybrid_alpha_sparse"] == 0.20
    assert updated["default_min_score"] == 0.50
    assert updated["default_top_k"] == 25

    # 3. Reset to default 0.70 / 0.30
    client.patch(
        "/admin/rag/config",
        json={"hybrid_alpha_dense": 0.70, "hybrid_alpha_sparse": 0.30, "default_min_score": 0.55},
        headers=headers,
    )


def test_admin_rag_search_logs(client: TestClient, db_session: Session):
    headers = _login_user(client, db_session, "admin_rag_logs@jobportal.vn", role="admin")
    response = client.get("/admin/rag/search-logs?page=1&page_size=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


def test_admin_rag_batch_reindex(client: TestClient, db_session: Session):
    headers = _login_user(client, db_session, "admin_rag_reindex@jobportal.vn", role="admin")
    response = client.post("/admin/rag/reindex-batch", json={"scope": "job"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["scope"] == "job"
    assert "indexed_jobs" in data


def test_admin_rag_maintenance_message_max_length_bound(client: TestClient, db_session: Session):
    """Verify input length bounds against DoS / memory bloat (max 500 chars)."""
    headers = _login_user(client, db_session, "admin_rag_bound@jobportal.vn", role="admin")
    oversized_payload = {"maintenance_message": "X" * 501}
    response = client.patch("/admin/rag/config", json=oversized_payload, headers=headers)
    assert response.status_code == 422


def test_admin_rag_batch_reindex_concurrency_lock(client: TestClient, db_session: Session):
    """Verify that concurrent batch reindex attempts are rejected with 409 Conflict."""
    from app.services.rag_governance_service import rag_governance_service

    headers = _login_user(client, db_session, "admin_rag_lock@jobportal.vn", role="admin")

    try:
        rag_governance_service._is_reindexing = True
        response = client.post("/admin/rag/reindex-batch", json={"scope": "job"}, headers=headers)
        assert response.status_code == 409
        err_msg = response.json().get("detail") or response.json().get("error", {}).get("message", "")
        assert "tiến trình tái lập chỉ mục khác" in err_msg
    finally:
        rag_governance_service._is_reindexing = False

