"""Business rules for department hiring-demand approval."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.company import crud_company
from app.crud.recruitment_request import crud_recruitment_request
from app.models.company import CompanyMembership, MembershipRole
from app.models.job import Job
from app.models.recruitment_request import RecruitmentRequest, RecruitmentRequestStatus
from app.models.user import User
from app.schemas.recruitment_request import (
    RecruitmentRequestCreate,
    RecruitmentRequestReview,
    RecruitmentRequestUpdate,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RecruitmentRequestService:
    def create(
        self,
        db: Session,
        *,
        company_id: int,
        membership: CompanyMembership,
        actor: User,
        data: RecruitmentRequestCreate,
    ) -> RecruitmentRequest:
        if membership.member_role != MembershipRole.DEPARTMENT_HEAD or membership.department_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ Trưởng bộ phận có phòng ban được tạo nhu cầu tuyển dụng.",
            )
        department = crud_company.get_department(db, department_id=membership.department_id)
        if department is None or department.company_id != company_id or not department.is_active:
            raise HTTPException(status_code=422, detail="Phòng ban không hợp lệ hoặc đã tạm dừng.")
        payload = data.model_dump(exclude={"submit"})
        request = RecruitmentRequest(
            **payload,
            company_id=company_id,
            department_id=membership.department_id,
            requested_by_id=actor.id,
            status=(
                RecruitmentRequestStatus.SUBMITTED
                if data.submit
                else RecruitmentRequestStatus.DRAFT
            ),
            submitted_at=_now() if data.submit else None,
        )
        crud_recruitment_request.create(db, request=request)
        self._audit(
            db,
            request=request,
            actor=actor,
            action="recruitment_request.submitted" if data.submit else "recruitment_request.created",
            details={"status": request.status.value, "headcount": request.headcount},
        )
        db.commit()
        return crud_recruitment_request.get(db, request_id=request.id)  # type: ignore[return-value]

    def update(
        self,
        db: Session,
        *,
        request: RecruitmentRequest,
        membership: CompanyMembership,
        actor: User,
        data: RecruitmentRequestUpdate,
    ) -> RecruitmentRequest:
        self._require_requester(request, membership, actor)
        if request.status not in {
            RecruitmentRequestStatus.DRAFT,
            RecruitmentRequestStatus.REJECTED,
        }:
            raise HTTPException(status_code=409, detail="Chỉ sửa được yêu cầu nháp hoặc bị từ chối.")
        changes = data.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(request, field, value)
        if request.status == RecruitmentRequestStatus.REJECTED:
            request.status = RecruitmentRequestStatus.DRAFT
            request.review_note = None
            request.reviewed_by_id = None
            request.reviewed_at = None
        self._audit(db, request=request, actor=actor, action="recruitment_request.updated", details={"fields": sorted(changes)})
        db.commit()
        return crud_recruitment_request.get(db, request_id=request.id)  # type: ignore[return-value]

    def submit(
        self,
        db: Session,
        *,
        request: RecruitmentRequest,
        membership: CompanyMembership,
        actor: User,
    ) -> RecruitmentRequest:
        self._require_requester(request, membership, actor)
        if request.status not in {
            RecruitmentRequestStatus.DRAFT,
            RecruitmentRequestStatus.REJECTED,
        }:
            raise HTTPException(status_code=409, detail="Yêu cầu không thể gửi duyệt ở trạng thái hiện tại.")
        request.status = RecruitmentRequestStatus.SUBMITTED
        request.submitted_at = _now()
        request.review_note = None
        request.reviewed_by_id = None
        request.reviewed_at = None
        self._audit(db, request=request, actor=actor, action="recruitment_request.submitted", details={})
        db.commit()
        return crud_recruitment_request.get(db, request_id=request.id)  # type: ignore[return-value]

    def review(
        self,
        db: Session,
        *,
        request: RecruitmentRequest,
        actor: User,
        data: RecruitmentRequestReview,
    ) -> RecruitmentRequest:
        if request.status != RecruitmentRequestStatus.SUBMITTED:
            raise HTTPException(status_code=409, detail="Chỉ duyệt yêu cầu đang chờ xem xét.")
        request.status = data.decision
        request.review_note = data.note
        request.reviewed_by_id = actor.id
        request.reviewed_at = _now()
        self._audit(
            db,
            request=request,
            actor=actor,
            action=f"recruitment_request.{data.decision.value}",
            details={"review_note": data.note},
        )
        db.commit()
        return crud_recruitment_request.get(db, request_id=request.id)  # type: ignore[return-value]

    def cancel(
        self,
        db: Session,
        *,
        request: RecruitmentRequest,
        membership: CompanyMembership,
        actor: User,
    ) -> RecruitmentRequest:
        self._require_requester(request, membership, actor)
        if request.status not in {
            RecruitmentRequestStatus.DRAFT,
            RecruitmentRequestStatus.SUBMITTED,
            RecruitmentRequestStatus.REJECTED,
        }:
            raise HTTPException(status_code=409, detail="Yêu cầu không thể hủy ở trạng thái hiện tại.")
        request.status = RecruitmentRequestStatus.CANCELLED
        request.cancelled_at = _now()
        self._audit(db, request=request, actor=actor, action="recruitment_request.cancelled", details={})
        db.commit()
        return crud_recruitment_request.get(db, request_id=request.id)  # type: ignore[return-value]

    def validate_conversion(
        self,
        db: Session,
        *,
        request_id: int,
        company_id: int,
    ) -> RecruitmentRequest:
        request = crud_recruitment_request.get(db, request_id=request_id)
        if request is None or request.company_id != company_id:
            raise HTTPException(status_code=404, detail="Nhu cầu tuyển dụng không tồn tại.")
        if request.status != RecruitmentRequestStatus.APPROVED:
            raise HTTPException(status_code=409, detail="Chỉ yêu cầu đã duyệt mới được chuyển thành tin tuyển dụng.")
        if request.converted_job_id is not None:
            raise HTTPException(status_code=409, detail="Yêu cầu đã được chuyển thành tin tuyển dụng.")
        return request

    def mark_converted(
        self,
        db: Session,
        *,
        request: RecruitmentRequest,
        job: Job,
        actor: User,
    ) -> None:
        request.converted_job_id = job.id
        request.converted_at = _now()
        self._audit(
            db,
            request=request,
            actor=actor,
            action="recruitment_request.converted",
            details={"job_id": job.id, "job_title": job.title},
        )
        db.commit()

    @staticmethod
    def _require_requester(
        request: RecruitmentRequest,
        membership: CompanyMembership,
        actor: User,
    ) -> None:
        if request.requested_by_id != actor.id or request.department_id != membership.department_id:
            raise HTTPException(status_code=403, detail="Bạn chỉ được thao tác yêu cầu của chính mình.")

    @staticmethod
    def _audit(
        db: Session,
        *,
        request: RecruitmentRequest,
        actor: User,
        action: str,
        details: dict,
    ) -> None:
        crud_admin_audit_log.create(
            db,
            actor_user_id=actor.id,
            actor_email=actor.email,
            company_id=request.company_id,
            action=action,
            target_type="recruitment_request",
            target_id=str(request.id),
            target_label=request.title,
            details={"company_id": request.company_id, **details},
        )


recruitment_request_service = RecruitmentRequestService()
