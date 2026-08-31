"""Tests for notification endpoints — GET, unread count, mark read."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud.notification import crud_notification
from app.crud.user import crud_user
from app.models.notification import NotificationType

PASSWORD = "StrongPass123!"


def _register_and_login(
    client: TestClient,
    *,
    email: str = "user@example.com",
    role: str = "candidate",
) -> dict[str, str]:
    """Register a user and return auth headers."""
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Test User",
            "role": role,
        },
    )
    login = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_notification(db: Session, user_id: int, message: str = "Test notification"):
    """Create a notification in the database directly."""
    return crud_notification.create(
        db,
        user_id=user_id,
        title="Thông báo hệ thống",
        message=message,
        type=NotificationType.APPLICATION_UPDATE,
    )


class TestGetNotifications:
    def test_list_notifications_empty(self, client: TestClient, db_session: Session):
        """Test listing notifications when none exist."""
        headers = _register_and_login(client)
        response = client.get("/notifications", headers=headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_notifications_with_data(self, client: TestClient, db_session: Session):
        """Test listing notifications returns created notifications."""
        headers = _register_and_login(client)
        user = crud_user.get_by_email(db_session, email="user@example.com")
        assert user is not None
        _create_notification(db_session, user.id, "Bạn có ứng tuyển mới!")
        _create_notification(db_session, user.id, "Lịch phỏng vấn sắp tới")

        response = client.get("/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_unauthenticated_cannot_list(self, client: TestClient):
        """Test unauthenticated request returns 401."""
        response = client.get("/notifications")
        assert response.status_code == 401


class TestUnreadCount:
    def test_unread_count_zero(self, client: TestClient, db_session: Session):
        """Test unread count when no notifications exist."""
        headers = _register_and_login(client)
        response = client.get("/notifications/unread-count", headers=headers)
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_unread_count_after_creation(self, client: TestClient, db_session: Session):
        """Test unread count increases with new notifications."""
        headers = _register_and_login(client)
        user = crud_user.get_by_email(db_session, email="user@example.com")
        assert user is not None
        _create_notification(db_session, user.id, "Notification 1")
        _create_notification(db_session, user.id, "Notification 2")

        response = client.get("/notifications/unread-count", headers=headers)
        assert response.status_code == 200
        assert response.json()["count"] == 2


class TestMarkRead:
    def test_mark_single_read(self, client: TestClient, db_session: Session):
        """Test marking a single notification as read."""
        headers = _register_and_login(client)
        user = crud_user.get_by_email(db_session, email="user@example.com")
        assert user is not None
        notif = _create_notification(db_session, user.id, "Read me")

        response = client.patch(f"/notifications/{notif.id}/read", headers=headers)
        assert response.status_code == 200
        assert response.json()["is_read"] is True

        # Unread count should decrease
        count_response = client.get("/notifications/unread-count", headers=headers)
        assert count_response.json()["count"] == 0

    def test_mark_nonexistent_returns_404(self, client: TestClient, db_session: Session):
        """Test marking a non-existent notification returns 404."""
        headers = _register_and_login(client)
        response = client.patch("/notifications/99999/read", headers=headers)
        assert response.status_code == 404

    def test_mark_all_read(self, client: TestClient, db_session: Session):
        """Test marking all notifications as read."""
        headers = _register_and_login(client)
        user = crud_user.get_by_email(db_session, email="user@example.com")
        assert user is not None
        _create_notification(db_session, user.id, "N1")
        _create_notification(db_session, user.id, "N2")
        _create_notification(db_session, user.id, "N3")

        response = client.patch("/notifications/read-all", headers=headers)
        assert response.status_code == 204

        count_response = client.get("/notifications/unread-count", headers=headers)
        assert count_response.json()["count"] == 0
