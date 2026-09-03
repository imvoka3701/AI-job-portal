"""Business logic for employer tenancy, team lifecycle, and ownership."""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.security import hash_password
from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.company import crud_company
from app.crud.job import crud_job
from app.crud.user import crud_user
from app.models.company import (
    Company,
    CompanyInvitation,
    CompanyMembership,
    Department,
    InvitationDeliveryStatus,
    InvitationStatus,
    JobAssignment,
    MembershipRole,
    MembershipStatus,
)
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.company import (
    DepartmentCreate,
    DepartmentUpdate,
    InvitationAccept,
    InvitationCreate,
    JobAssignmentBatchItem,
    JobAssignmentRead,
    MembershipUpdate,
)
from app.schemas.user import UserCreate
from app.services.invitation_email_service import invitation_email_service


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_expired(expires_at: datetime) -> bool:
    now = _now()
    if expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)
    return expires_at <= now


class CompanyService:
    def bootstrap_employer_company(self, db: Session, *, user: User) -> CompanyMembership:
        existing = crud_company.get_active_membership(db, user_id=user.id)
        if existing:
            return existing
        company = Company(
            name=user.company_name or user.full_name,
            description=user.company_description,
            logo_url=user.company_logo_url,
            # Account approval controls login; company suspension is a separate lifecycle.
            is_active=True,
            created_by_user_id=user.id,
        )
        db.add(company)
        db.flush()
        membership = CompanyMembership(
            company_id=company.id,
            user_id=user.id,
            member_role=MembershipRole.HR,
            status=MembershipStatus.ACTIVE,
            is_owner=True,
            invited_by=user.id,
        )
        db.add(membership)
        db.commit()
        return crud_company.get_active_membership(db, user_id=user.id)  # type: ignore[return-value]

    def ensure_employer_membership(self, db: Session, *, user: User) -> CompanyMembership:
        membership = crud_company.get_active_membership(db, user_id=user.id)
        if membership:
            return membership
        previous = crud_company.get_latest_membership_for_user(db, user_id=user.id)
        if previous and previous.status in {MembershipStatus.SUSPENDED, MembershipStatus.REVOKED}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quyền truy cập doanh nghiệp đã bị tạm khóa hoặc thu hồi.",
            )
        return self.bootstrap_employer_company(db, user=user)

    def create_department(
        self, db: Session, *, company_id: int, data: DepartmentCreate, actor: User
    ) -> Department:
        department = Department(company_id=company_id, **data.model_dump())
        db.add(department)
        db.flush()
        self._audit(
            db,
            actor,
            "department.created",
            "department",
            department.id,
            data.name,
            {},
            company_id=company_id,
        )
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="Tên phòng ban đã tồn tại.") from exc
        db.refresh(department)
        return department

    def update_department(
        self,
        db: Session,
        *,
        department: Department,
        data: DepartmentUpdate,
        actor: User,
    ) -> Department:
        changes = data.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(department, field, value)
        self._audit(
            db,
            actor,
            "department.updated",
            "department",
            department.id,
            department.name,
            changes,
            company_id=department.company_id,
        )
        db.commit()
        db.refresh(department)
        return department

    def create_invitation(
        self,
        db: Session,
        *,
        company: Company,
        data: InvitationCreate,
        actor: User,
        background_tasks: Any = None,
    ) -> tuple[CompanyInvitation, str]:
        email = str(data.email).lower()
        if crud_company.get_pending_invitation(db, company_id=company.id, email=email):
            raise HTTPException(status_code=409, detail="Email này đã có lời mời đang chờ.")
        department = self._validate_department(db, company.id, data.department_id)
        if data.member_role == MembershipRole.DEPARTMENT_HEAD and department is None:
            raise HTTPException(
                status_code=422, detail="Trưởng bộ phận phải được gán một phòng ban."
            )
        existing_user = crud_user.get_by_email(db, email=email)
        if existing_user:
            existing_membership = crud_company.get_active_membership(db, user_id=existing_user.id)
            if existing_membership:
                raise HTTPException(
                    status_code=409, detail="Người dùng đã là thành viên của một doanh nghiệp."
                )
            if existing_user.role != UserRole.EMPLOYER:
                raise HTTPException(
                    status_code=409, detail="Email đang thuộc tài khoản không phải Employer."
                )
        token = secrets.token_urlsafe(32)
        invitation = CompanyInvitation(
            company_id=company.id,
            email=email,
            member_role=data.member_role,
            department_id=data.department_id,
            status=InvitationStatus.PENDING,
            token_hash=_token_hash(token),
            invited_by=actor.id,
            expires_at=_now() + timedelta(days=7),
        )
        db.add(invitation)
        db.flush()
        self._audit(
            db,
            actor,
            "membership.invited",
            "invitation",
            invitation.id,
            email,
            {"role": data.member_role.value, "department_id": data.department_id},
            company_id=company.id,
        )
        db.commit()
        db.refresh(invitation)
        invitation = crud_company.get_invitation(db, invitation_id=invitation.id)
        if background_tasks is not None:
            background_tasks.add_task(
                deliver_invitation_background_task,
                invitation_id=invitation.id,
                token=token,
                actor_id=actor.id,
            )
        else:
            self.deliver_invitation(db, invitation=invitation, token=token, actor=actor)  # type: ignore[arg-type]
        return crud_company.get_invitation(db, invitation_id=invitation.id), token  # type: ignore[union-attr,return-value]

    def get_invitation_by_token(self, db: Session, *, token: str) -> CompanyInvitation:
        invitation = crud_company.get_invitation_by_hash(db, token_hash=_token_hash(token))
        if invitation is None:
            raise HTTPException(status_code=404, detail="Lời mời không tồn tại.")
        if invitation.status == InvitationStatus.PENDING and _is_expired(invitation.expires_at):
            invitation.status = InvitationStatus.EXPIRED
            db.commit()
        return invitation

    def accept_invitation(
        self, db: Session, *, token: str, data: InvitationAccept
    ) -> CompanyMembership:
        invitation = self.get_invitation_by_token(db, token=token)
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(status_code=409, detail="Lời mời không còn hiệu lực.")
        user = crud_user.get_by_email(db, email=invitation.email)
        if user is None:
            if not data.full_name or not data.password:
                raise HTTPException(
                    status_code=422, detail="Cần họ tên và mật khẩu để tạo tài khoản."
                )
            user_in = UserCreate(
                email=invitation.email,
                password=data.password,
                full_name=data.full_name,
                role=UserRole.EMPLOYER,
                company_name=invitation.company.name,
            )
            user = crud_user.create(
                db,
                obj_in=user_in,
                hashed_password=hash_password(data.password),
                commit=False,
            )
        if user.role != UserRole.EMPLOYER:
            raise HTTPException(status_code=409, detail="Tài khoản không thuộc nhóm Employer.")
        if crud_company.get_active_membership(db, user_id=user.id):
            raise HTTPException(
                status_code=409, detail="Tài khoản đã tham gia một doanh nghiệp khác."
            )
        existing = crud_company.get_membership_for_user(
            db, company_id=invitation.company_id, user_id=user.id
        )
        if existing:
            existing.status = MembershipStatus.ACTIVE
            existing.member_role = invitation.member_role
            existing.department_id = invitation.department_id
            existing.membership_version += 1
            membership = existing
        else:
            membership = CompanyMembership(
                company_id=invitation.company_id,
                user_id=user.id,
                member_role=invitation.member_role,
                department_id=invitation.department_id,
                status=MembershipStatus.ACTIVE,
                is_owner=False,
                invited_by=invitation.invited_by,
            )
            db.add(membership)
        db.flush()
        user.is_active = True
        user.company_name = invitation.company.name
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = _now()
        self._audit(
            db,
            user,
            "membership.accepted",
            "membership",
            membership.id,
            user.email,
            {"role": invitation.member_role.value},
            company_id=invitation.company_id,
        )
        db.commit()
        return crud_company.get_active_membership(db, user_id=user.id)  # type: ignore[return-value]

    def decline_invitation(self, db: Session, *, token: str) -> CompanyInvitation:
        invitation = self.get_invitation_by_token(db, token=token)
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(status_code=409, detail="Lời mời không còn hiệu lực.")
        invitation.status = InvitationStatus.DECLINED
        db.commit()
        db.refresh(invitation)
        return invitation

    def resend_invitation(
        self,
        db: Session,
        *,
        invitation: CompanyInvitation,
        actor: User,
        background_tasks: Any = None,
    ) -> tuple[CompanyInvitation, str]:
        if invitation.status not in {InvitationStatus.PENDING, InvitationStatus.EXPIRED}:
            raise HTTPException(status_code=409, detail="Không thể gửi lại lời mời này.")
        token = secrets.token_urlsafe(32)
        invitation.token_hash = _token_hash(token)
        invitation.status = InvitationStatus.PENDING
        invitation.expires_at = _now() + timedelta(days=7)
        self._audit(
            db,
            actor,
            "membership.invitation_resent",
            "invitation",
            invitation.id,
            invitation.email,
            {},
            company_id=invitation.company_id,
        )
        db.commit()
        invitation = crud_company.get_invitation(db, invitation_id=invitation.id)
        if background_tasks is not None:
            background_tasks.add_task(
                deliver_invitation_background_task,
                invitation_id=invitation.id,
                token=token,
                actor_id=actor.id,
            )
        else:
            self.deliver_invitation(db, invitation=invitation, token=token, actor=actor)  # type: ignore[arg-type]
        return crud_company.get_invitation(db, invitation_id=invitation.id), token  # type: ignore[union-attr,return-value]

    def deliver_invitation(
        self,
        db: Session,
        *,
        invitation: CompanyInvitation,
        token: str,
        actor: User,
    ) -> CompanyInvitation:
        if not invitation_email_service.configured:
            invitation.delivery_status = InvitationDeliveryStatus.NOT_CONFIGURED
            invitation.delivery_error = None
            db.commit()
            return invitation

        invitation.delivery_status = InvitationDeliveryStatus.PENDING
        invitation.delivery_attempts += 1
        invitation.delivery_error = None
        invitation.bounced_at = None
        db.commit()

        result = invitation_email_service.send(invitation, token=token)
        invitation.delivery_status = result.status
        invitation.message_id = result.message_id
        invitation.delivery_error = result.error
        invitation.sent_at = _now() if result.status == InvitationDeliveryStatus.SENT else None
        self._audit(
            db,
            actor,
            "membership.invitation_delivery_updated",
            "invitation",
            invitation.id,
            invitation.email,
            {
                "delivery_status": result.status.value,
                "delivery_attempts": invitation.delivery_attempts,
            },
            company_id=invitation.company_id,
        )
        db.commit()
        db.refresh(invitation)
        return invitation

    def mark_invitation_bounced(
        self,
        db: Session,
        *,
        invitation: CompanyInvitation,
        reason: str | None,
    ) -> CompanyInvitation:
        if invitation.delivery_status not in {
            InvitationDeliveryStatus.SENT,
            InvitationDeliveryStatus.BOUNCED,
        }:
            raise HTTPException(status_code=409, detail="Email chưa ở trạng thái đã gửi.")
        invitation.delivery_status = InvitationDeliveryStatus.BOUNCED
        invitation.delivery_error = reason or "Nhà cung cấp email báo không thể giao thư."
        invitation.bounced_at = _now()
        crud_admin_audit_log.create(
            db,
            actor_user_id=None,
            actor_email="email-provider",
            company_id=invitation.company_id,
            action="membership.invitation_bounced",
            target_type="invitation",
            target_id=str(invitation.id),
            target_label=invitation.email,
            details={"company_id": invitation.company_id, "reason": invitation.delivery_error},
        )
        db.commit()
        db.refresh(invitation)
        return invitation

    def revoke_invitation(
        self, db: Session, *, invitation: CompanyInvitation, actor: User
    ) -> CompanyInvitation:
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(status_code=409, detail="Chỉ có thể hủy lời mời đang chờ.")
        invitation.status = InvitationStatus.REVOKED
        self._audit(
            db,
            actor,
            "membership.invitation_revoked",
            "invitation",
            invitation.id,
            invitation.email,
            {},
            company_id=invitation.company_id,
        )
        db.commit()
        db.refresh(invitation)
        return invitation

    def update_membership(
        self,
        db: Session,
        *,
        membership: CompanyMembership,
        data: MembershipUpdate,
        actor: User,
    ) -> CompanyMembership:
        if membership.is_owner:
            raise HTTPException(
                status_code=409, detail="Hãy chuyển ownership trước khi sửa hoặc khóa owner."
            )
        changes = data.model_dump(exclude_unset=True)
        next_role = changes.get("member_role", membership.member_role)
        next_department_id = changes.get("department_id", membership.department_id)
        self._validate_department(db, membership.company_id, next_department_id)
        if next_role == MembershipRole.DEPARTMENT_HEAD and next_department_id is None:
            raise HTTPException(status_code=422, detail="Trưởng bộ phận phải được gán phòng ban.")
        if changes.get("status") == MembershipStatus.REVOKED:
            db.execute(delete(JobAssignment).where(JobAssignment.membership_id == membership.id))
        for field, value in changes.items():
            setattr(membership, field, value)
        membership.membership_version += 1
        self._audit(
            db,
            actor,
            "membership.updated",
            "membership",
            membership.id,
            membership.user.email,
            {key: getattr(value, "value", value) for key, value in changes.items()},
            company_id=membership.company_id,
        )
        db.commit()
        return crud_company.get_membership(db, membership_id=membership.id)  # type: ignore[return-value]

    def transfer_ownership(
        self,
        db: Session,
        *,
        current_owner: CompanyMembership,
        new_owner: CompanyMembership,
        actor: User,
    ) -> CompanyMembership:
        if not current_owner.is_owner or current_owner.user_id != actor.id:
            raise HTTPException(
                status_code=403, detail="Chỉ owner hiện tại được chuyển quyền sở hữu."
            )
        if (
            new_owner.company_id != current_owner.company_id
            or new_owner.status != MembershipStatus.ACTIVE
        ):
            raise HTTPException(
                status_code=422, detail="Owner mới phải là thành viên đang hoạt động cùng công ty."
            )
        current_owner.is_owner = False
        new_owner.is_owner = True
        new_owner.member_role = MembershipRole.HR
        current_owner.membership_version += 1
        new_owner.membership_version += 1
        self._audit(
            db,
            actor,
            "membership.ownership_transferred",
            "membership",
            new_owner.id,
            new_owner.user.email,
            {"previous_owner_id": current_owner.id},
            company_id=current_owner.company_id,
        )
        db.commit()
        return crud_company.get_membership(db, membership_id=new_owner.id)  # type: ignore[return-value]

    def replace_job_assignments(
        self,
        db: Session,
        *,
        job: Job,
        membership_ids: list[int],
        actor: User,
    ) -> list[int]:
        valid_ids: list[int] = []
        for membership_id in dict.fromkeys(membership_ids):
            member = crud_company.get_membership(db, membership_id=membership_id)
            if (
                member is None
                or member.company_id != job.company_id
                or member.status != MembershipStatus.ACTIVE
            ):
                raise HTTPException(
                    status_code=422, detail=f"Thành viên {membership_id} không hợp lệ."
                )
            valid_ids.append(membership_id)
        previous_ids = crud_company.get_job_assignment_membership_ids(db, job_id=job.id)
        crud_company.replace_job_assignments_batch(
            db,
            assignments={job.id: valid_ids},
            assigned_by=actor.id,
        )
        self._audit(
            db,
            actor,
            "job.assignments_updated",
            "job",
            job.id,
            job.title,
            {"previous_membership_ids": previous_ids, "membership_ids": valid_ids},
            company_id=job.company_id,
        )
        db.commit()
        return valid_ids

    def replace_job_assignments_batch(
        self,
        db: Session,
        *,
        company_id: int,
        assignments: list[JobAssignmentBatchItem],
        actor: User,
    ) -> list[JobAssignmentRead]:
        normalized = {item.job_id: list(dict.fromkeys(item.membership_ids)) for item in assignments}
        job_ids = list(normalized)
        jobs = crud_job.get_by_ids_for_company(
            db,
            job_ids=job_ids,
            company_id=company_id,
        )
        if len(jobs) != len(job_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Một hoặc nhiều job không tồn tại trong doanh nghiệp.",
            )

        membership_ids = sorted(
            {
                membership_id
                for item_membership_ids in normalized.values()
                for membership_id in item_membership_ids
            }
        )
        valid_memberships = crud_company.get_active_memberships_by_ids(
            db,
            company_id=company_id,
            membership_ids=membership_ids,
        )
        valid_membership_ids = {membership.id for membership in valid_memberships}
        invalid_membership_ids = [
            membership_id
            for membership_id in membership_ids
            if membership_id not in valid_membership_ids
        ]
        if invalid_membership_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Thành viên không hợp lệ: {invalid_membership_ids}.",
            )

        previous = crud_company.get_job_assignments_map(db, job_ids=job_ids)
        crud_company.replace_job_assignments_batch(
            db,
            assignments=normalized,
            assigned_by=actor.id,
        )
        jobs_by_id = {job.id: job for job in jobs}
        changes = [
            {
                "job_id": job_id,
                "job_title": jobs_by_id[job_id].title,
                "previous_membership_ids": previous[job_id],
                "membership_ids": normalized[job_id],
            }
            for job_id in job_ids
            if previous[job_id] != normalized[job_id]
        ]
        self._audit(
            db,
            actor,
            "job.assignments_batch_updated",
            "job_assignment_batch",
            company_id,
            f"{len(job_ids)} job",
            {"job_ids": job_ids, "changes": changes},
            company_id=company_id,
        )
        db.commit()
        return [
            JobAssignmentRead(job_id=job_id, membership_ids=normalized[job_id])
            for job_id in job_ids
        ]

    @staticmethod
    def _validate_department(
        db: Session, company_id: int, department_id: int | None
    ) -> Department | None:
        if department_id is None:
            return None
        department = crud_company.get_department(db, department_id=department_id)
        if department is None or department.company_id != company_id:
            raise HTTPException(status_code=422, detail="Phòng ban không thuộc doanh nghiệp.")
        return department

    @staticmethod
    def _audit(
        db: Session,
        actor: User,
        action: str,
        target_type: str,
        target_id: int | None,
        target_label: str | None,
        details: dict,
        *,
        company_id: int | None = None,
    ) -> None:
        audit_details = {"company_id": company_id, **details} if company_id is not None else details
        crud_admin_audit_log.create(
            db,
            actor_user_id=actor.id,
            actor_email=actor.email,
            company_id=company_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            target_label=target_label,
            details=audit_details,
        )


company_service = CompanyService()


def deliver_invitation_background_task(invitation_id: int, token: str, actor_id: int) -> None:
    """Deliver invitation email in a background task using its own fresh DB session."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        invitation = crud_company.get_invitation(db, invitation_id=invitation_id)
        actor = crud_user.get_by_id(db, user_id=actor_id)
        if invitation and actor:
            company_service.deliver_invitation(db, invitation=invitation, token=token, actor=actor)
    except Exception:
        logger.exception("Failed to deliver background invitation %s", invitation_id)
    finally:
        db.close()
