"""Comprehensive test suite for the User Feedback System and Admin Dashboard Integration."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.feedback import UserFeedback
from app.models.user import User, UserRole


def _create_user(
    db: Session,
    *,
    email: str,
    role: UserRole,
    is_active: bool = True,
    full_name: str = "Test User",
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password("secret123"),
        full_name=full_name,
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str) -> dict[str, str]:
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
def admin_user_and_headers(client: TestClient, db_session: Session) -> tuple[User, dict[str, str]]:
    user = _create_user(db_session, email="admin_feedback_test@portal.com", role=UserRole.ADMIN, full_name="Admin Boss")
    headers = _login(client, user.email)
    return user, headers


@pytest.fixture
def candidate_user_and_headers(client: TestClient, db_session: Session) -> tuple[User, dict[str, str]]:
    user = _create_user(db_session, email="candidate_feedback_test@example.com", role=UserRole.CANDIDATE, full_name="Nguyễn Ứng Viên")
    headers = _login(client, user.email)
    return user, headers


class TestUserFeedbackSystem:
    def test_submit_public_guest_feedback(self, client: TestClient, db_session: Session):
        """Guests can submit feedback without an Authorization header."""
        payload = {
            "sender_name": "Khách Vãng Lai",
            "sender_email": "guest@example.com",
            "sender_phone": "0987654321",
            "feedback_type": "bug_report",
            "title": "Lỗi hiển thị trên trang chủ",
            "content": "Tôi thấy giao diện bị giật lag khi cuộn trang danh sách việc làm.",
            "rating": 2,
        }
        resp = client.post("/feedback", json=payload)
        assert resp.status_code in (200, 201), resp.text
        data = resp.json()
        assert data["sender_email"] == "guest@example.com"
        assert data["user_role"] == "guest"
        assert data["status"] == "new"
        assert data["priority"] == "medium"

        # Verify persisted in DB
        fb = db_session.query(UserFeedback).filter(UserFeedback.id == data["id"]).first()
        assert fb is not None
        assert fb.sender_name == "Khách Vãng Lai"
        assert fb.rating == 2

    def test_submit_authenticated_candidate_feedback(
        self, client: TestClient, db_session: Session, candidate_user_and_headers: tuple[User, dict[str, str]]
    ):
        """Authenticated candidates submitting feedback automatically associate with their user account."""
        user, headers = candidate_user_and_headers
        payload = {
            "sender_name": user.full_name,
            "sender_email": user.email,
            "feedback_type": "feature_request",
            "title": "Đề xuất tính năng xuất CV sang PDF",
            "content": "Mong ban quản trị hỗ trợ tính năng tải trực tiếp CV định dạng PDF chất lượng cao.",
            "rating": 5,
        }
        resp = client.post("/feedback", json=payload, headers=headers)
        assert resp.status_code in (200, 201), resp.text
        data = resp.json()
        assert data["user_id"] == user.id
        assert data["user_role"] == "candidate"
        assert data["rating"] == 5

    def test_admin_list_feedbacks_with_filtering(
        self,
        client: TestClient,
        db_session: Session,
        admin_user_and_headers: tuple[User, dict[str, str]],
        candidate_user_and_headers: tuple[User, dict[str, str]],
    ):
        """Admins can view and filter feedback, while non-admins are forbidden."""
        _, admin_headers = admin_user_and_headers
        _, candidate_headers = candidate_user_and_headers

        # Non-admin forbidden
        forbidden_resp = client.get("/admin/feedback", headers=candidate_headers)
        assert forbidden_resp.status_code == 403

        # Admin authorized
        admin_resp = client.get("/admin/feedback", headers=admin_headers)
        assert admin_resp.status_code == 200
        result = admin_resp.json()
        assert "items" in result
        assert "total" in result

    def test_admin_update_feedback_resolution(
        self, client: TestClient, db_session: Session, admin_user_and_headers: tuple[User, dict[str, str]]
    ):
        """Admin can resolve feedback with notes and resolution reply."""
        _, admin_headers = admin_user_and_headers

        # Create a feedback to resolve
        fb = UserFeedback(
            sender_name="Doanh nghiệp TechCorp",
            sender_email="contact@techcorp.vn",
            user_role="employer",
            feedback_type="general",
            title="Góp ý về quy trình duyệt tin",
            content="Quy trình duyệt tin hiện tại rất nhanh và tiện lợi.",
            rating=5,
            status="new",
            priority="medium",
        )
        db_session.add(fb)
        db_session.commit()
        db_session.refresh(fb)

        patch_payload = {
            "status": "resolved",
            "admin_notes": "Đã ghi nhận và gửi thư cảm ơn đối tác TechCorp.",
            "admin_response": "Cảm ơn quý doanh nghiệp đã đồng hành cùng AI Job Portal!",
        }
        patch_resp = client.patch(f"/admin/feedback/{fb.id}", json=patch_payload, headers=admin_headers)
        assert patch_resp.status_code == 200
        updated = patch_resp.json()
        assert updated["status"] == "resolved"
        assert updated["admin_notes"] == patch_payload["admin_notes"]

    def test_admin_feedback_stats_and_dashboard_alerts(
        self, client: TestClient, db_session: Session, admin_user_and_headers: tuple[User, dict[str, str]]
    ):
        """Feedback stats accurately reflect pending count and alerts are integrated."""
        _, admin_headers = admin_user_and_headers

        # Clean feedbacks table
        db_session.query(UserFeedback).delete()
        db_session.commit()

        # Add 1 pending feedback and 1 resolved feedback
        fb1 = UserFeedback(
            sender_name="User A",
            sender_email="a@test.com",
            user_role="candidate",
            feedback_type="bug_report",
            title="Lỗi phỏng vấn",
            content="Microphone bị ngắt kết nối giữa chừng.",
            rating=1,
            status="new",
            priority="urgent",
        )
        fb2 = UserFeedback(
            sender_name="User B",
            sender_email="b@test.com",
            user_role="employer",
            feedback_type="feature_request",
            title="Thêm phân quyền thành viên",
            content="Cho phép tạo tài khoản HR phụ.",
            rating=4,
            status="resolved",
            priority="low",
        )
        db_session.add_all([fb1, fb2])
        db_session.commit()

        # Check /admin/feedback/stats
        stats_resp = client.get("/admin/feedback/stats", headers=admin_headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats["total_feedbacks"] == 2
        assert stats["pending_feedbacks"] == 1
        assert stats["resolved_feedbacks"] == 1
        assert stats["avg_csat_rating"] == 2.5

        # Check /admin/alerts contains pending_feedbacks
        alerts_resp = client.get("/admin/alerts", headers=admin_headers)
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert "pending_feedbacks" in alerts
        assert alerts["pending_feedbacks"] == 1
        assert alerts["urgent_feedbacks"] == 1
