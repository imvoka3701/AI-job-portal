"""Employer recruitment-demand request workflow."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    require_company_permission,
)
from app.crud.recruitment_request import crud_recruitment_request
from app.database import get_db
from app.models.company import MembershipRole
from app.models.recruitment_request import RecruitmentRequest, RecruitmentRequestStatus
from app.schemas.recruitment_request import (
    RecruitmentRequestCreate,
    RecruitmentRequestPage,
    RecruitmentRequestRead,
    RecruitmentRequestReview,
    RecruitmentRequestUpdate,
)
from app.services.recruitment_request_service import recruitment_request_service


router = APIRouter(prefix="/employer/recruitment-requests", tags=["Recruitment Requests"])


def _read(request: RecruitmentRequest) -> RecruitmentRequestRead:
    return RecruitmentRequestRead(
        id=request.id,
        company_id=request.company_id,
        department_id=request.department_id,
        department_name=request.department.name,
        requested_by_id=request.requested_by_id,
        requester_name=request.requester.full_name,
        requester_email=request.requester.email,
        title=request.title,
        headcount=request.headcount,
        job_type=request.job_type,
        priority=request.priority,
        reason=request.reason,
        responsibilities=request.responsibilities,
        requirements=request.requirements,
        target_start_date=request.target_start_date,
        status=request.status,
        review_note=request.review_note,
        reviewed_by_id=request.reviewed_by_id,
        reviewer_name=request.reviewer.full_name if request.reviewer else None,
        submitted_at=request.submitted_at,
        reviewed_at=request.reviewed_at,
        cancelled_at=request.cancelled_at,
        converted_job_id=request.converted_job_id,
        converted_at=request.converted_at,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )


def _get_scoped(
    db: Session,
    *,
    request_id: int,
    context: CompanyContext,
) -> RecruitmentRequest:
    request = crud_recruitment_request.get(db, request_id=request_id)
    if request is None or request.company_id != context.company.id:
        raise HTTPException(status_code=404, detail="Nhu cầu tuyển dụng không tồn tại.")
    if (
        context.membership.member_role == MembershipRole.DEPARTMENT_HEAD
        and request.department_id != context.membership.department_id
    ):
        raise HTTPException(status_code=404, detail="Nhu cầu tuyển dụng không tồn tại.")
    return request


@router.get("", response_model=RecruitmentRequestPage, summary="List recruitment requests")
def list_requests(
    request_status: RecruitmentRequestStatus | None = Query(None, alias="status"),
    department_id: int | None = Query(None, ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_VIEW)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestPage:
    scoped_department = (
        context.membership.department_id
        if context.membership.member_role == MembershipRole.DEPARTMENT_HEAD
        else department_id
    )
    items, total = crud_recruitment_request.list(
        db,
        company_id=context.company.id,
        department_id=scoped_department,
        request_status=request_status,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return RecruitmentRequestPage(
        items=[_read(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=RecruitmentRequestRead, status_code=status.HTTP_201_CREATED, summary="Create recruitment request")
def create_request(
    data: RecruitmentRequestCreate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_CREATE)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    return _read(recruitment_request_service.create(
        db,
        company_id=context.company.id,
        membership=context.membership,
        actor=context.user,
        data=data,
    ))


@router.get("/{request_id}", response_model=RecruitmentRequestRead, summary="Get recruitment request")
def get_request(
    request_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_VIEW)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    return _read(_get_scoped(db, request_id=request_id, context=context))


@router.patch("/{request_id}", response_model=RecruitmentRequestRead, summary="Update recruitment request draft")
def update_request(
    request_id: int,
    data: RecruitmentRequestUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_CREATE)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    request = _get_scoped(db, request_id=request_id, context=context)
    return _read(recruitment_request_service.update(
        db, request=request, membership=context.membership, actor=context.user, data=data
    ))


@router.post("/{request_id}/submit", response_model=RecruitmentRequestRead, summary="Submit recruitment request")
def submit_request(
    request_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_CREATE)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    request = _get_scoped(db, request_id=request_id, context=context)
    return _read(recruitment_request_service.submit(
        db, request=request, membership=context.membership, actor=context.user
    ))


@router.post("/{request_id}/review", response_model=RecruitmentRequestRead, summary="Approve or reject recruitment request")
def review_request(
    request_id: int,
    data: RecruitmentRequestReview,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_REVIEW)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    request = _get_scoped(db, request_id=request_id, context=context)
    return _read(recruitment_request_service.review(
        db, request=request, actor=context.user, data=data
    ))


@router.post("/{request_id}/cancel", response_model=RecruitmentRequestRead, summary="Cancel recruitment request")
def cancel_request(
    request_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.RECRUITMENT_REQUEST_CREATE)
    ),
    db: Session = Depends(get_db),
) -> RecruitmentRequestRead:
    request = _get_scoped(db, request_id=request_id, context=context)
    return _read(recruitment_request_service.cancel(
        db, request=request, membership=context.membership, actor=context.user
    ))
