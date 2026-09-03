"""
Tests for BackgroundTasks execution (Email delivery & Notifications).
Verifies that background tasks are correctly scheduled and executed without blocking HTTP responses.
"""

import pytest
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models.company import Company, CompanyInvitation, MembershipRole
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.company import InvitationCreate
from app.services.company_service import (
    company_service,
    deliver_invitation_background_task,
)
from app.routers.applications import _send_application_notification_task


def test_invitation_schedules_background_task(db_session: Session):
    """Verify that create_invitation and resend_invitation queue tasks in BackgroundTasks."""
    # Find or create employer user and company
    owner = db_session.query(User).filter(User.role == UserRole.EMPLOYER).first()
    if not owner:
        owner = User(
            email="bg_owner@example.com",
            full_name="BG Owner",
            hashed_password="pw",
            role=UserRole.EMPLOYER,
        )
        db_session.add(owner)
        db_session.commit()
        db_session.refresh(owner)

    company = db_session.query(Company).first()
    if not company:
        company = Company(
            name="BG Tech",
            description="Testing background tasks",
            created_by_user_id=owner.id,
        )
        db_session.add(company)
        db_session.commit()
        db_session.refresh(company)

    data = InvitationCreate(
        email="bg_invitee@example.com",
        member_role=MembershipRole.HR,
    )

    bg_tasks = BackgroundTasks()
    invitation, token = company_service.create_invitation(
        db_session,
        company=company,
        data=data,
        actor=owner,
        background_tasks=bg_tasks,
    )

    assert invitation is not None
    assert token is not None
    assert len(bg_tasks.tasks) == 1
    assert bg_tasks.tasks[0].func == deliver_invitation_background_task

    # Test resend also queues task
    resend_bg_tasks = BackgroundTasks()
    re_inv, re_token = company_service.resend_invitation(
        db_session,
        invitation=invitation,
        actor=owner,
        background_tasks=resend_bg_tasks,
    )
    assert len(resend_bg_tasks.tasks) == 1
    assert resend_bg_tasks.tasks[0].func == deliver_invitation_background_task


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
