"""Database access for companies, memberships, departments, and invitations."""

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.company import (
    Company,
    CompanyInvitation,
    CompanyMembership,
    Department,
    InvitationStatus,
    JobAssignment,
    MembershipStatus,
)


class CRUDCompany:
    def get_by_id(self, db: Session, *, company_id: int) -> Company | None:
        return db.get(Company, company_id)

    def get_by_creator(self, db: Session, *, user_id: int) -> Company | None:
        return db.execute(
            select(Company).where(Company.created_by_user_id == user_id)
        ).scalar_one_or_none()

    def get_active_membership(self, db: Session, *, user_id: int) -> CompanyMembership | None:
        stmt = (
            select(CompanyMembership)
            .where(
                CompanyMembership.user_id == user_id,
                CompanyMembership.status == MembershipStatus.ACTIVE,
            )
            .options(
                joinedload(CompanyMembership.company), joinedload(CompanyMembership.department)
            )
            .order_by(CompanyMembership.id)
        )
        return db.execute(stmt).scalars().first()

    def get_latest_membership_for_user(
        self, db: Session, *, user_id: int
    ) -> CompanyMembership | None:
        stmt = (
            select(CompanyMembership)
            .where(CompanyMembership.user_id == user_id)
            .options(
                joinedload(CompanyMembership.company), joinedload(CompanyMembership.department)
            )
            .order_by(CompanyMembership.id.desc())
        )
        return db.execute(stmt).scalars().first()

    def get_membership(self, db: Session, *, membership_id: int) -> CompanyMembership | None:
        stmt = (
            select(CompanyMembership)
            .where(CompanyMembership.id == membership_id)
            .options(joinedload(CompanyMembership.user), joinedload(CompanyMembership.department))
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_membership_for_user(
        self, db: Session, *, company_id: int, user_id: int
    ) -> CompanyMembership | None:
        return db.execute(
            select(CompanyMembership).where(
                CompanyMembership.company_id == company_id,
                CompanyMembership.user_id == user_id,
            )
        ).scalar_one_or_none()

    def list_members(
        self,
        db: Session,
        *,
        company_id: int,
        keyword: str | None = None,
        role: str | None = None,
        status: str | None = None,
        department_id: int | None = None,
    ) -> list[CompanyMembership]:
        from app.models.user import User

        stmt = (
            select(CompanyMembership)
            .join(User, CompanyMembership.user_id == User.id)
            .where(CompanyMembership.company_id == company_id)
            .options(joinedload(CompanyMembership.user), joinedload(CompanyMembership.department))
        )
        if keyword:
            pattern = f"%{keyword.strip()}%"
            stmt = stmt.where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
        if role:
            stmt = stmt.where(CompanyMembership.member_role == role)
        if status:
            stmt = stmt.where(CompanyMembership.status == status)
        if department_id is not None:
            stmt = stmt.where(CompanyMembership.department_id == department_id)
        return list(
            db.execute(stmt.order_by(CompanyMembership.is_owner.desc(), User.full_name))
            .scalars()
            .unique()
            .all()
        )

    def count_owners(self, db: Session, *, company_id: int) -> int:
        return (
            db.execute(
                select(func.count())
                .select_from(CompanyMembership)
                .where(
                    CompanyMembership.company_id == company_id,
                    CompanyMembership.is_owner.is_(True),
                    CompanyMembership.status == MembershipStatus.ACTIVE,
                )
            ).scalar()
            or 0
        )

    def get_department(self, db: Session, *, department_id: int) -> Department | None:
        return db.get(Department, department_id)

    def list_departments(self, db: Session, *, company_id: int) -> list[Department]:
        return list(
            db.execute(
                select(Department)
                .where(Department.company_id == company_id)
                .order_by(Department.is_active.desc(), Department.name)
            )
            .scalars()
            .all()
        )

    def list_invitations(self, db: Session, *, company_id: int) -> list[CompanyInvitation]:
        stmt = (
            select(CompanyInvitation)
            .where(CompanyInvitation.company_id == company_id)
            .options(
                joinedload(CompanyInvitation.company), joinedload(CompanyInvitation.department)
            )
            .order_by(CompanyInvitation.created_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    def get_invitation(self, db: Session, *, invitation_id: int) -> CompanyInvitation | None:
        stmt = (
            select(CompanyInvitation)
            .where(CompanyInvitation.id == invitation_id)
            .options(
                joinedload(CompanyInvitation.company), joinedload(CompanyInvitation.department)
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_invitation_by_hash(self, db: Session, *, token_hash: str) -> CompanyInvitation | None:
        stmt = (
            select(CompanyInvitation)
            .where(CompanyInvitation.token_hash == token_hash)
            .options(
                joinedload(CompanyInvitation.company), joinedload(CompanyInvitation.department)
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_invitation_by_message_id(
        self, db: Session, *, message_id: str
    ) -> CompanyInvitation | None:
        stmt = (
            select(CompanyInvitation)
            .where(CompanyInvitation.message_id == message_id)
            .options(
                joinedload(CompanyInvitation.company), joinedload(CompanyInvitation.department)
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_pending_invitation(
        self, db: Session, *, company_id: int, email: str
    ) -> CompanyInvitation | None:
        return db.execute(
            select(CompanyInvitation).where(
                CompanyInvitation.company_id == company_id,
                func.lower(CompanyInvitation.email) == email.lower(),
                CompanyInvitation.status == InvitationStatus.PENDING,
            )
        ).scalar_one_or_none()

    def get_job_assignment_membership_ids(self, db: Session, *, job_id: int) -> list[int]:
        return list(
            db.execute(select(JobAssignment.membership_id).where(JobAssignment.job_id == job_id))
            .scalars()
            .all()
        )

    def get_job_assignments_map(
        self,
        db: Session,
        *,
        job_ids: list[int],
    ) -> dict[int, list[int]]:
        result = {job_id: [] for job_id in job_ids}
        if not job_ids:
            return result
        rows = db.execute(
            select(JobAssignment.job_id, JobAssignment.membership_id).where(
                JobAssignment.job_id.in_(job_ids)
            )
        ).all()
        for job_id, membership_id in rows:
            result[job_id].append(membership_id)
        return result

    def get_active_memberships_by_ids(
        self,
        db: Session,
        *,
        company_id: int,
        membership_ids: list[int],
    ) -> list[CompanyMembership]:
        if not membership_ids:
            return []
        return list(
            db.execute(
                select(CompanyMembership).where(
                    CompanyMembership.id.in_(membership_ids),
                    CompanyMembership.company_id == company_id,
                    CompanyMembership.status == MembershipStatus.ACTIVE,
                )
            )
            .scalars()
            .all()
        )

    def replace_job_assignments_batch(
        self,
        db: Session,
        *,
        assignments: dict[int, list[int]],
        assigned_by: int,
    ) -> None:
        job_ids = list(assignments)
        if not job_ids:
            return
        db.execute(delete(JobAssignment).where(JobAssignment.job_id.in_(job_ids)))
        db.add_all(
            JobAssignment(
                job_id=job_id,
                membership_id=membership_id,
                assigned_by=assigned_by,
            )
            for job_id, membership_ids in assignments.items()
            for membership_id in membership_ids
        )

    def is_assigned_to_job(self, db: Session, *, job_id: int, membership_id: int) -> bool:
        return (
            db.execute(
                select(JobAssignment.id).where(
                    JobAssignment.job_id == job_id,
                    JobAssignment.membership_id == membership_id,
                )
            ).scalar_one_or_none()
            is not None
        )

    def list_scoped_jobs(
        self,
        db: Session,
        *,
        company_id: int,
        membership_id: int,
        department_id: int | None,
        unrestricted: bool,
    ):
        from app.models.job import Job

        stmt = select(Job).where(Job.company_id == company_id)
        if not unrestricted:
            assigned_job_ids = select(JobAssignment.job_id).where(
                JobAssignment.membership_id == membership_id
            )
            stmt = stmt.where(
                or_(
                    Job.department_id == department_id,
                    Job.id.in_(assigned_job_ids),
                )
            )
        return list(
            db.execute(stmt.options(joinedload(Job.employer)).order_by(Job.created_at.desc()))
            .scalars()
            .unique()
            .all()
        )


crud_company = CRUDCompany()
