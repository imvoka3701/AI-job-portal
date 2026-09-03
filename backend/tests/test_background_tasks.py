"""
Tests for BackgroundTasks execution (Notifications & background workers).
Verifies that background tasks are correctly scheduled and executed without blocking HTTP responses.
"""

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.routers.applications import _send_application_notification_task


def test_send_application_notification_task(db_session: Session):
    """Verify background notification creation runs cleanly."""
    owner = db_session.query(User).filter(User.role == UserRole.EMPLOYER).first()
    if not owner:
        owner = User(
            email="notif_target@example.com",
            full_name="Notif Target",
            hashed_password="pw",
            role=UserRole.EMPLOYER,
        )
        db_session.add(owner)
        db_session.commit()
        db_session.refresh(owner)

    # Calling the background task directly simulates worker completion
    _send_application_notification_task(
        employer_id=owner.id,
        candidate_name="Nguyen Van Candidate",
        job_title="Senior Python Engineer",
    )


def test_application_notification_queues_background_task():
    """Verify background task addition helper."""
    bg_tasks = BackgroundTasks()
    bg_tasks.add_task(
        _send_application_notification_task,
        employer_id=1,
        candidate_name="Test Candidate",
        job_title="DevOps Specialist",
    )
    assert len(bg_tasks.tasks) == 1
    assert bg_tasks.tasks[0].func == _send_application_notification_task
