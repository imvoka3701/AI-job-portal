"""Employer company context, departments, memberships, invitations, and assignments."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    get_company_context,
    require_company_permission,
    require_job_scope,
)
from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.company import crud_company
from app.crud.job import crud_job
from app.database import get_db
from app.models.company import CompanyInvitation, CompanyMembership, MembershipRole
from app.schemas.company import (
    CompanyActivityPage,
    CompanyActivityRead,
    CompanyContextRead,
    CompanyRead,
    DepartmentCreate,
    DepartmentRead,
    DepartmentUpdate,
    InvitationAccept,
    InvitationCreate,
    InvitationCreated,
    InvitationRead,
    JobAssignmentRead,
    JobAssignmentsBatchRead,
    JobAssignmentsBatchUpdate,
    JobAssignmentsUpdate,
    MembershipRead,
    MembershipUpdate,
)
from app.schemas.job import JobRead
from app.services.company_service import company_service

router = APIRouter(prefix="/employer", tags=["Employer Team"])


def _membership_read(membership: CompanyMembership) -> MembershipRead:
    return MembershipRead(
        id=membership.id,
        company_id=membership.company_id,
        user_id=membership.user_id,
        full_name=membership.user.full_name,
        email=membership.user.email,
        avatar_url=membership.user.avatar_url,
        member_role=membership.member_role,
        department_id=membership.department_id,
        department_name=membership.department.name if membership.department else None,
        status=membership.status,
        is_owner=membership.is_owner,
        joined_at=membership.joined_at,
        updated_at=membership.updated_at,
    )


def _invitation_read(
    invitation: CompanyInvitation,
    *,
    token: str | None = None,
) -> InvitationRead | InvitationCreated:
    data = {
        "id": invitation.id,
        "company_id": invitation.company_id,
        "company_name": invitation.company.name,
        "email": invitation.email,
        "member_role": invitation.member_role,
        "department_id": invitation.department_id,
        "department_name": invitation.department.name if invitation.department else None,
        "status": invitation.status,
        "delivery_status": invitation.delivery_status,
        "delivery_attempts": invitation.delivery_attempts,
        "message_id": invitation.message_id,
        "delivery_error": invitation.delivery_error,
        "sent_at": invitation.sent_at,
        "bounced_at": invitation.bounced_at,
        "expires_at": invitation.expires_at,
        "created_at": invitation.created_at,
    }
    if token is None:
        return InvitationRead(**data)
    return InvitationCreated(
        **data,
        invite_token=token,
        invite_path=f"/employer/invitations/{token}/accept",
    )


@router.get("/company-context", response_model=CompanyContextRead)
def get_context(
    context: CompanyContext = Depends(get_company_context),
    db: Session = Depends(get_db),
) -> CompanyContextRead:
    return CompanyContextRead(
        company=CompanyRead.model_validate(context.company),
        membership=_membership_read(context.membership),
        permissions=sorted(permission.value for permission in context.permissions),
        departments=[
            DepartmentRead.model_validate(item)
            for item in crud_company.list_departments(db, company_id=context.company.id)
        ],
    )


@router.get("/team/members", response_model=list[MembershipRead])
def list_members(
    keyword: str | None = Query(None, max_length=100),
    role: str | None = Query(None),
    member_status: str | None = Query(None, alias="status"),
    department_id: int | None = Query(None, ge=1),
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_VIEW)),
    db: Session = Depends(get_db),
) -> list[MembershipRead]:
    memberships = crud_company.list_members(
        db,
        company_id=context.company.id,
        keyword=keyword,
        role=role,
        status=member_status,
        department_id=department_id,
    )
    return [_membership_read(item) for item in memberships]


@router.patch("/team/members/{membership_id}", response_model=MembershipRead)
def update_member(
    membership_id: int,
    data: MembershipUpdate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> MembershipRead:
    membership = crud_company.get_membership(db, membership_id=membership_id)
    if membership is None or membership.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Thành viên không tồn tại.")
    updated = company_service.update_membership(
        db, membership=membership, data=data, actor=context.user
    )
    return _membership_read(updated)


@router.post(
    "/team/members/{membership_id}/transfer-ownership",
    response_model=MembershipRead,
)
def transfer_ownership(
    membership_id: int,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> MembershipRead:
    new_owner = crud_company.get_membership(db, membership_id=membership_id)
    if new_owner is None or new_owner.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Thành viên không tồn tại.")
    updated = company_service.transfer_ownership(
        db,
        current_owner=context.membership,
        new_owner=new_owner,
        actor=context.user,
    )
    return _membership_read(updated)


@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_VIEW)),
    db: Session = Depends(get_db),
) -> list[DepartmentRead]:
    return [
        DepartmentRead.model_validate(item)
        for item in crud_company.list_departments(db, company_id=context.company.id)
    ]


@router.post(
    "/departments",
    response_model=DepartmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    data: DepartmentCreate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> DepartmentRead:
    department = company_service.create_department(
        db, company_id=context.company.id, data=data, actor=context.user
    )
    return DepartmentRead.model_validate(department)


@router.patch("/departments/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> DepartmentRead:
    department = crud_company.get_department(db, department_id=department_id)
    if department is None or department.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Phòng ban không tồn tại.")
    updated = company_service.update_department(
        db, department=department, data=data, actor=context.user
    )
    return DepartmentRead.model_validate(updated)


@router.get("/team/invitations", response_model=list[InvitationRead])
def list_invitations(
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> list[InvitationRead]:
    return [
        _invitation_read(item)
        for item in crud_company.list_invitations(db, company_id=context.company.id)
    ]


@router.post(
    "/team/invitations",
    response_model=InvitationCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_invitation(
    data: InvitationCreate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> InvitationCreated:
    invitation, token = company_service.create_invitation(
        db, company=context.company, data=data, actor=context.user
    )
    return _invitation_read(invitation, token=token)  # type: ignore[return-value]


@router.post(
    "/team/invitations/{invitation_id}/resend",
    response_model=InvitationCreated,
)
def resend_invitation(
    invitation_id: int,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> InvitationCreated:
    invitation = crud_company.get_invitation(db, invitation_id=invitation_id)
    if invitation is None or invitation.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Lời mời không tồn tại.")
    invitation, token = company_service.resend_invitation(
        db, invitation=invitation, actor=context.user
    )
    return _invitation_read(invitation, token=token)  # type: ignore[return-value]


@router.post("/team/invitations/{invitation_id}/revoke", response_model=InvitationRead)
def revoke_invitation(
    invitation_id: int,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> InvitationRead:
    invitation = crud_company.get_invitation(db, invitation_id=invitation_id)
    if invitation is None or invitation.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Lời mời không tồn tại.")
    return _invitation_read(
        company_service.revoke_invitation(db, invitation=invitation, actor=context.user)
    )  # type: ignore[return-value]


@router.get("/invitations/{token}", response_model=InvitationRead)
def get_invitation(token: str, db: Session = Depends(get_db)) -> InvitationRead:
    return _invitation_read(company_service.get_invitation_by_token(db, token=token))  # type: ignore[return-value]


@router.post("/invitations/{token}/accept", response_model=MembershipRead)
def accept_invitation(
    token: str,
    data: InvitationAccept,
    db: Session = Depends(get_db),
) -> MembershipRead:
    return _membership_read(company_service.accept_invitation(db, token=token, data=data))


@router.post("/invitations/{token}/decline", response_model=InvitationRead)
def decline_invitation(token: str, db: Session = Depends(get_db)) -> InvitationRead:
    return _invitation_read(company_service.decline_invitation(db, token=token))  # type: ignore[return-value]


@router.get("/team/jobs/{job_id}/assignments", response_model=JobAssignmentRead)
def get_job_assignments(
    job_id: int,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.JOB_MANAGE)),
    db: Session = Depends(get_db),
) -> JobAssignmentRead:
    job = crud_job.get_by_id(db, job_id=job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job không tồn tại.")
    require_job_scope(db, context=context, job=job)
    return JobAssignmentRead(
        job_id=job.id,
        membership_ids=crud_company.get_job_assignment_membership_ids(db, job_id=job.id),
    )


@router.get(
    "/team/job-assignments",
    response_model=JobAssignmentsBatchRead,
    summary="List all job assignments for the company",
)
def get_job_assignments_batch(
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.JOB_MANAGE)),
    db: Session = Depends(get_db),
) -> JobAssignmentsBatchRead:
    """Return assignments for every company job in one request."""
    jobs = crud_company.list_scoped_jobs(
        db,
        company_id=context.company.id,
        membership_id=context.membership.id,
        department_id=context.membership.department_id,
        unrestricted=True,
    )
    job_ids = [job.id for job in jobs]
    assignments = crud_company.get_job_assignments_map(db, job_ids=job_ids)
    return JobAssignmentsBatchRead(
        assignments=[
            JobAssignmentRead(job_id=job_id, membership_ids=assignments[job_id])
            for job_id in job_ids
        ]
    )


@router.put(
    "/team/job-assignments",
    response_model=JobAssignmentsBatchRead,
    summary="Replace assignments for multiple jobs atomically",
)
def update_job_assignments_batch(
    data: JobAssignmentsBatchUpdate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.JOB_MANAGE)),
    db: Session = Depends(get_db),
) -> JobAssignmentsBatchRead:
    """Validate the complete batch before replacing any assignment rows."""
    assignments = company_service.replace_job_assignments_batch(
        db,
        company_id=context.company.id,
        assignments=data.assignments,
        actor=context.user,
    )
    return JobAssignmentsBatchRead(assignments=assignments)


@router.get("/team/jobs", response_model=list[JobRead])
def list_scoped_jobs(
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.JOB_VIEW)),
    db: Session = Depends(get_db),
) -> list[JobRead]:
    jobs = crud_company.list_scoped_jobs(
        db,
        company_id=context.company.id,
        membership_id=context.membership.id,
        department_id=context.membership.department_id,
        unrestricted=(
            context.membership.is_owner or context.membership.member_role == MembershipRole.HR
        ),
    )
    return [JobRead.model_validate(job) for job in jobs]


@router.put("/team/jobs/{job_id}/assignments", response_model=JobAssignmentRead)
def update_job_assignments(
    job_id: int,
    data: JobAssignmentsUpdate,
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.JOB_MANAGE)),
    db: Session = Depends(get_db),
) -> JobAssignmentRead:
    job = crud_job.get_by_id(db, job_id=job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job không tồn tại.")
    require_job_scope(db, context=context, job=job)
    membership_ids = company_service.replace_job_assignments(
        db,
        job=job,
        membership_ids=data.membership_ids,
        actor=context.user,
    )
    return JobAssignmentRead(job_id=job.id, membership_ids=membership_ids)


@router.get(
    "/team/activity",
    response_model=CompanyActivityPage,
    summary="List immutable company team activity",
)
def list_company_activity(
    action: str | None = Query(None, max_length=100),
    target_type: str | None = Query(None, max_length=50),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    context: CompanyContext = Depends(require_company_permission(CompanyPermission.TEAM_MANAGE)),
    db: Session = Depends(get_db),
) -> CompanyActivityPage:
    """Return a newest-first activity trail strictly scoped by company_id."""
    items, total = crud_admin_audit_log.get_company_activity(
        db,
        company_id=context.company.id,
        action=action,
        target_type=target_type,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return CompanyActivityPage(
        items=[CompanyActivityRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
