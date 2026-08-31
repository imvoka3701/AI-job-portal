from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status

from app.core.company_permissions import CompanyPermission
from app.models.user import UserRole
from app.routers.ai import _authorize_resume_access

# ---------------------------------------------------------
# Mock Models & Helpers for Testing
# ---------------------------------------------------------


class MockUser:
    def __init__(self, id: int, role: UserRole):
        self.id = id
        self.role = role


class MockResume:
    def __init__(self, id: int, user_id: int):
        self.id = id
        self.user_id = user_id


class MockJob:
    def __init__(self, id: int, company_id: int | None = None, department_id: int | None = None):
        self.id = id
        self.company_id = company_id
        self.department_id = department_id


class MockApplication:
    def __init__(self, id: int, job: MockJob):
        self.id = id
        self.job = job


class MockContext:
    def __init__(self, permissions: list[CompanyPermission]):
        self.permissions = set(permissions)

    def has(self, permission: CompanyPermission) -> bool:
        return permission in self.permissions


# ---------------------------------------------------------
# Test Cases
# ---------------------------------------------------------


def test_candidate_success():
    """Candidate accessing their own resume."""
    db = MagicMock()
    current_user = MockUser(id=1, role=UserRole.CANDIDATE)
    resume = MockResume(id=10, user_id=1)

    # Should not raise any exception
    _authorize_resume_access(db, current_user=current_user, resume=resume)


def test_candidate_unauthorized():
    """Candidate trying to access a resume belonging to a different user."""
    db = MagicMock()
    current_user = MockUser(id=1, role=UserRole.CANDIDATE)
    resume = MockResume(id=10, user_id=2)  # Different user

    with pytest.raises(HTTPException) as exc_info:
        _authorize_resume_access(db, current_user=current_user, resume=resume)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail == "Bạn không có quyền truy cập CV này."


@patch("app.routers.ai.build_company_context")
@patch("app.routers.ai.crud_application")
@patch("app.routers.ai.require_application_scope")
def test_hr_success(
    mock_require_application_scope, mock_crud_application, mock_build_company_context
):
    """Employer with AI_RECRUITMENT permission accessing a resume correctly submitted to their scope."""
    db = MagicMock()
    current_user = MockUser(id=2, role=UserRole.EMPLOYER)
    resume = MockResume(id=10, user_id=1)

    # Mock context with required AI_RECRUITMENT permission
    mock_context = MockContext(permissions=[CompanyPermission.AI_RECRUITMENT])
    mock_build_company_context.return_value = mock_context

    # Mock application returned for the resume (submitted to their company)
    mock_app = MockApplication(id=100, job=MockJob(id=200))
    mock_crud_application.get_by_resume.return_value = [mock_app]

    # require_application_scope does not raise exception (implies success/in scope)
    mock_require_application_scope.return_value = None

    # Should not raise any exception
    _authorize_resume_access(db, current_user=current_user, resume=resume)

    mock_build_company_context.assert_called_once_with(db, current_user)
    mock_crud_application.get_by_resume.assert_called_once_with(db, resume_id=resume.id)
    mock_require_application_scope.assert_called_once_with(
        db, context=mock_context, application=mock_app
    )


@patch("app.routers.ai.build_company_context")
def test_hr_missing_permission(mock_build_company_context):
    """Employer without the AI_RECRUITMENT permission."""
    db = MagicMock()
    current_user = MockUser(id=2, role=UserRole.EMPLOYER)
    resume = MockResume(id=10, user_id=1)

    # Mock context missing AI_RECRUITMENT
    mock_context = MockContext(permissions=[CompanyPermission.JOB_VIEW])
    mock_build_company_context.return_value = mock_context

    with pytest.raises(HTTPException) as exc_info:
        _authorize_resume_access(db, current_user=current_user, resume=resume)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert (
        exc_info.value.detail
        == "Bạn không có quyền sử dụng tính năng AI tuyển dụng. Vui lòng liên hệ Admin."
    )


@patch("app.routers.ai.build_company_context")
@patch("app.routers.ai.crud_application")
@patch("app.routers.ai.require_application_scope")
def test_hr_tenant_violation(
    mock_require_application_scope, mock_crud_application, mock_build_company_context
):
    """Employer attempting to access a resume submitted to a DIFFERENT company (Tenant Violation)."""
    db = MagicMock()
    current_user = MockUser(id=2, role=UserRole.EMPLOYER)
    resume = MockResume(id=10, user_id=1)

    mock_context = MockContext(permissions=[CompanyPermission.AI_RECRUITMENT])
    mock_build_company_context.return_value = mock_context

    # The candidate never applied to any job in this employer's company
    mock_crud_application.get_by_resume.return_value = []

    with pytest.raises(HTTPException) as exc_info:
        _authorize_resume_access(db, current_user=current_user, resume=resume)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail == "CV này chưa được nộp cho công việc nào thuộc công ty của bạn."


@patch("app.routers.ai.build_company_context")
@patch("app.routers.ai.crud_application")
@patch("app.routers.ai.require_application_scope")
def test_hr_department_violation(
    mock_require_application_scope, mock_crud_application, mock_build_company_context
):
    """Employer attempting to access a resume outside their permitted department scope."""
    db = MagicMock()
    current_user = MockUser(id=2, role=UserRole.EMPLOYER)
    resume = MockResume(id=10, user_id=1)

    mock_context = MockContext(permissions=[CompanyPermission.AI_RECRUITMENT])
    mock_build_company_context.return_value = mock_context

    mock_app = MockApplication(id=100, job=MockJob(id=200))
    mock_crud_application.get_by_resume.return_value = [mock_app]

    # Simulate that require_application_scope raises 403 (out of scope/department)
    def mock_require_scope(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job nằm ngoài phòng ban hoặc phạm vi được phân công.",
        )

    mock_require_application_scope.side_effect = mock_require_scope

    with pytest.raises(HTTPException) as exc_info:
        _authorize_resume_access(db, current_user=current_user, resume=resume)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert (
        exc_info.value.detail
        == "CV nằm ngoài phạm vi phòng ban hoặc dữ liệu tuyển dụng được phân công của bạn."
    )


@patch("app.routers.ai.build_company_context")
@patch("app.routers.ai.crud_job")
@patch("app.routers.ai.require_job_scope")
def test_hr_target_job_violation(mock_require_job_scope, mock_crud_job, mock_build_company_context):
    """Employer attempting to evaluate a resume against a target job outside their scope."""
    db = MagicMock()
    current_user = MockUser(id=2, role=UserRole.EMPLOYER)
    resume = MockResume(id=10, user_id=1)
    target_job_id = 999

    mock_context = MockContext(permissions=[CompanyPermission.AI_RECRUITMENT])
    mock_build_company_context.return_value = mock_context

    mock_job = MockJob(id=target_job_id)
    mock_crud_job.get_by_id.return_value = mock_job

    # Simulate that require_job_scope raises 403 (employer does not have access to the target job)
    def mock_require_scope(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Job không thuộc doanh nghiệp của bạn."
        )

    mock_require_job_scope.side_effect = mock_require_scope

    with pytest.raises(HTTPException) as exc_info:
        # Note: job_id is passed here
        _authorize_resume_access(db, current_user=current_user, resume=resume, job_id=target_job_id)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail == "Job không thuộc doanh nghiệp của bạn."
