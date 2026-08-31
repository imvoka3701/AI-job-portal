"""Business rules for privileged administrator actions."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.admin import crud_admin
from app.crud.admin_audit_log import crud_admin_audit_log
from app.crud.company import crud_company
from app.models.job import Job
from app.models.user import User, UserRole


def set_company_status(
    db: Session,
    *,
    company_id: int,
    is_active: bool,
    actor: User,
) -> User:
    company = crud_admin.get_company(db, company_id=company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer not found")
    previous = company.is_active
    company.is_active = is_active
    membership = crud_company.get_active_membership(db, user_id=company.id)
    if membership is not None:
        membership.company.is_active = is_active
    crud_admin_audit_log.create(
        db,
        actor_user_id=actor.id,
        actor_email=actor.email,
        action="company.approved" if is_active else "company.deactivated",
        target_type="company",
        target_id=str(company.id),
        target_label=company.company_name or company.full_name,
        details={"previous_active": previous, "new_active": is_active},
    )
    db.commit()
    db.refresh(company)
    return company


def set_user_status(
    db: Session,
    *,
    user_id: int,
    is_active: bool,
    actor: User,
) -> User:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == actor.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự khóa tài khoản Admin đang đăng nhập.",
        )
    if (
        target.role == UserRole.ADMIN
        and target.is_active
        and not is_active
        and crud_admin.count_active_admins(db) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hệ thống phải còn ít nhất một tài khoản Admin hoạt động.",
        )
    previous = target.is_active
    target.is_active = is_active
    crud_admin_audit_log.create(
        db,
        actor_user_id=actor.id,
        actor_email=actor.email,
        action="user.activated" if is_active else "user.deactivated",
        target_type="user",
        target_id=str(target.id),
        target_label=target.email,
        details={"role": target.role.value, "previous_active": previous, "new_active": is_active},
    )
    db.commit()
    db.refresh(target)
    return target


def set_job_status(
    db: Session,
    *,
    job_id: int,
    is_active: bool,
    actor: User,
) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    previous = job.is_active
    job.is_active = is_active
    crud_admin_audit_log.create(
        db,
        actor_user_id=actor.id,
        actor_email=actor.email,
        action="job.activated" if is_active else "job.deactivated",
        target_type="job",
        target_id=str(job.id),
        target_label=job.title,
        details={
            "previous_active": previous,
            "new_active": is_active,
            "employer_id": job.employer_id,
        },
    )
    db.commit()
    db.refresh(job)
    return job


def permanently_delete_job(db: Session, *, job_id: int, actor: User) -> None:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    target_label = job.title
    employer_id = job.employer_id
    crud_admin.delete_job_with_dependencies(db, job_id=job_id)
    crud_admin_audit_log.create(
        db,
        actor_user_id=actor.id,
        actor_email=actor.email,
        action="job.deleted",
        target_type="job",
        target_id=str(job_id),
        target_label=target_label,
        details={"employer_id": employer_id},
    )
    db.commit()
