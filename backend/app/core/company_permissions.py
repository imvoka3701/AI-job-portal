"""Central permission policy and tenant scope for employer members."""

from dataclasses import dataclass
from enum import StrEnum

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.crud.company import crud_company
from app.database import get_db
from app.models.application import Application
from app.models.company import Company, CompanyMembership, MembershipRole
from app.models.job import Job
from app.models.user import User, UserRole
from app.services.company_service import company_service


class CompanyPermission(StrEnum):
    ANALYTICS_VIEW = "analytics:view"
    JOB_VIEW = "job:view"
    JOB_MANAGE = "job:manage"
    APPLICATION_VIEW = "application:view"
    PIPELINE_MANAGE = "pipeline:manage"
    INTERVIEW_MANAGE = "interview:manage"
    INTERVIEW_EVALUATE = "interview:evaluate"
    CANDIDATE_RECOMMEND = "candidate:recommend"
    FINAL_DECISION = "candidate:final_decision"
    AI_RECRUITMENT = "ai:recruitment"
    TEAM_VIEW = "team:view"
    TEAM_MANAGE = "team:manage"
    RECRUITMENT_REQUEST_VIEW = "recruitment_request:view"
    RECRUITMENT_REQUEST_CREATE = "recruitment_request:create"
    RECRUITMENT_REQUEST_REVIEW = "recruitment_request:review"


HR_PERMISSIONS = frozenset(
    {
        CompanyPermission.ANALYTICS_VIEW,
        CompanyPermission.JOB_VIEW,
        CompanyPermission.JOB_MANAGE,
        CompanyPermission.APPLICATION_VIEW,
        CompanyPermission.PIPELINE_MANAGE,
        CompanyPermission.INTERVIEW_MANAGE,
        CompanyPermission.INTERVIEW_EVALUATE,
        CompanyPermission.FINAL_DECISION,
        CompanyPermission.AI_RECRUITMENT,
        CompanyPermission.TEAM_VIEW,
        CompanyPermission.RECRUITMENT_REQUEST_VIEW,
        CompanyPermission.RECRUITMENT_REQUEST_REVIEW,
    }
)

HEAD_PERMISSIONS = frozenset(
    {
        CompanyPermission.ANALYTICS_VIEW,
        CompanyPermission.JOB_VIEW,
        CompanyPermission.APPLICATION_VIEW,
        CompanyPermission.INTERVIEW_EVALUATE,
        CompanyPermission.CANDIDATE_RECOMMEND,
        CompanyPermission.AI_RECRUITMENT,
        CompanyPermission.TEAM_VIEW,
        CompanyPermission.RECRUITMENT_REQUEST_VIEW,
        CompanyPermission.RECRUITMENT_REQUEST_CREATE,
    }
)


@dataclass(frozen=True)
class CompanyContext:
    user: User
    company: Company
    membership: CompanyMembership
    permissions: frozenset[CompanyPermission]

    def has(self, permission: CompanyPermission) -> bool:
        return permission in self.permissions


def get_company_context(
    current_user: User = Depends(require_role(UserRole.EMPLOYER)),
    db: Session = Depends(get_db),
) -> CompanyContext:
    return build_company_context(db, current_user)


def build_company_context(db: Session, current_user: User) -> CompanyContext:
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer only.")
    membership = company_service.ensure_employer_membership(db, user=current_user)
    if not membership.company.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doanh nghiệp đang bị khóa.")
    permissions = set(HR_PERMISSIONS if membership.member_role == MembershipRole.HR else HEAD_PERMISSIONS)
    if membership.is_owner:
        permissions.add(CompanyPermission.TEAM_MANAGE)
    return CompanyContext(
        user=current_user,
        company=membership.company,
        membership=membership,
        permissions=frozenset(permissions),
    )


def require_company_permission(permission: CompanyPermission):
    def checker(context: CompanyContext = Depends(get_company_context)) -> CompanyContext:
        if not context.has(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này trong doanh nghiệp.",
            )
        return context

    return checker


def require_job_scope(db: Session, *, context: CompanyContext, job: Job) -> None:
    if job.company_id is None and job.employer_id == context.user.id:
        job.company_id = context.company.id
        db.commit()
        db.refresh(job)
    if job.company_id != context.company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job không thuộc doanh nghiệp của bạn.")
    if context.membership.is_owner or context.membership.member_role == MembershipRole.HR:
        return
    same_department = (
        context.membership.department_id is not None
        and job.department_id == context.membership.department_id
    )
    explicitly_assigned = crud_company.is_assigned_to_job(
        db, job_id=job.id, membership_id=context.membership.id
    )
    if not same_department and not explicitly_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job nằm ngoài phòng ban hoặc phạm vi được phân công.",
        )


def require_application_scope(
    db: Session,
    *,
    context: CompanyContext,
    application: Application,
) -> None:
    require_job_scope(db, context=context, job=application.job)
