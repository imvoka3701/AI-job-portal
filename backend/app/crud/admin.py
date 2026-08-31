"""Database access for administrator management views and mutations."""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.interview_round import InterviewRound
from app.models.job import Job
from app.models.user import User, UserRole


class CRUDAdmin:
    def list_companies(
        self,
        db: Session,
        *,
        keyword: str | None = None,
        is_active: bool | None = None,
    ) -> list[User]:
        stmt = select(User).where(User.role == UserRole.EMPLOYER)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            stmt = stmt.where(
                or_(
                    User.company_name.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        stmt = stmt.order_by(User.created_at.desc())
        return list(db.execute(stmt).scalars().all())

    def get_company(self, db: Session, *, company_id: int) -> User | None:
        stmt = select(User).where(
            User.id == company_id,
            User.role == UserRole.EMPLOYER,
        )
        return db.execute(stmt).scalar_one_or_none()

    def list_jobs(
        self,
        db: Session,
        *,
        keyword: str | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Job], int]:
        stmt = select(Job)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            stmt = stmt.join(User, Job.employer_id == User.id).where(
                or_(
                    Job.title.ilike(pattern),
                    User.company_name.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        if is_active is not None:
            stmt = stmt.where(Job.is_active == is_active)
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
        items = list(
            db.execute(
                stmt.options(joinedload(Job.employer))
                .order_by(Job.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            .scalars()
            .unique()
            .all()
        )
        return items, total

    def list_users(
        self,
        db: Session,
        *,
        keyword: str | None = None,
        role: UserRole | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.company_name.ilike(pattern),
                )
            )
        if role is not None:
            stmt = stmt.where(User.role == role)
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
        items = list(
            db.execute(stmt.order_by(User.created_at.desc()).offset(skip).limit(limit))
            .scalars()
            .all()
        )
        return items, total

    def count_active_admins(self, db: Session) -> int:
        stmt = (
            select(func.count())
            .select_from(User)
            .where(
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
            )
        )
        return db.execute(stmt).scalar() or 0

    def delete_job_with_dependencies(self, db: Session, *, job_id: int) -> bool:
        job = db.get(Job, job_id)
        if job is None:
            return False
        db.execute(
            text(
                "DELETE FROM round_criteria_scores WHERE round_id IN "
                "(SELECT ir.id FROM interview_rounds ir JOIN applications a "
                "ON ir.application_id = a.id WHERE a.job_id = :job_id)"
            ),
            {"job_id": job_id},
        )
        db.execute(
            text(
                "DELETE FROM interview_rounds WHERE application_id IN "
                "(SELECT id FROM applications WHERE job_id = :job_id)"
            ),
            {"job_id": job_id},
        )
        db.execute(text("DELETE FROM applications WHERE job_id = :job_id"), {"job_id": job_id})
        db.delete(job)
        db.flush()
        return True

    def list_interview_rounds(
        self,
        db: Session,
        *,
        result: str | None = None,
        round_type: str | None = None,
        needs_review: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[InterviewRound], int]:
        stmt = select(InterviewRound).join(InterviewRound.application)
        if result:
            if result == "pending":
                stmt = stmt.where(InterviewRound.status.in_(["pending", "in_progress"]))
            elif result in ("passed", "failed"):
                stmt = stmt.where(InterviewRound.status == result)
        if round_type:
            r_type = {"technical": "tech", "phone_screen": "hr", "behavioral": "hr"}.get(
                round_type, round_type
            )
            stmt = stmt.where(InterviewRound.round_type == r_type)
        if needs_review is not None:
            stmt = stmt.where(InterviewRound.needs_review == needs_review)

        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
        items = list(
            db.execute(
                stmt.options(
                    joinedload(InterviewRound.application).joinedload(Application.candidate),
                    joinedload(InterviewRound.application)
                    .joinedload(Application.job)
                    .joinedload(Job.employer),
                )
                .order_by(InterviewRound.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            .scalars()
            .unique()
            .all()
        )
        return items, total

    def get_interview_round(self, db: Session, *, round_id: int) -> InterviewRound | None:
        stmt = (
            select(InterviewRound)
            .options(
                joinedload(InterviewRound.application).joinedload(Application.candidate),
                joinedload(InterviewRound.application)
                .joinedload(Application.job)
                .joinedload(Job.employer),
            )
            .where(InterviewRound.id == round_id)
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_system_alerts(self, db: Session) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        # 1. Overdue interviews
        overdue_stmt = (
            select(InterviewRound)
            .options(
                joinedload(InterviewRound.application).joinedload(Application.candidate),
                joinedload(InterviewRound.application)
                .joinedload(Application.job)
                .joinedload(Job.employer),
            )
            .where(
                InterviewRound.status.in_(["pending", "in_progress"]),
                InterviewRound.scheduled_at.isnot(None),
                InterviewRound.scheduled_at < now,
            )
            .order_by(InterviewRound.scheduled_at.asc())
            .limit(10)
        )
        overdue_rounds = list(db.execute(overdue_stmt).scalars().unique().all())
        overdue_alerts = []
        for r in overdue_rounds:
            days_overdue = max(1, (now - r.scheduled_at).days) if r.scheduled_at else 1
            cand_name = (
                r.application.candidate.full_name
                if r.application and r.application.candidate
                else "N/A"
            )
            job_title = r.application.job.title if r.application and r.application.job else "N/A"
            comp_name = (
                r.application.job.employer.company_name or r.application.job.employer.full_name
                if r.application and r.application.job and r.application.job.employer
                else "N/A"
            )
            overdue_alerts.append(
                {
                    "round_id": r.id,
                    "candidate_name": cand_name,
                    "job_title": job_title,
                    "company_name": comp_name,
                    "days_overdue": days_overdue,
                }
            )

        # 2. Stale jobs (active > 30 days)
        thirty_days_ago = now - timedelta(days=30)
        stale_jobs_stmt = (
            select(Job)
            .options(joinedload(Job.employer))
            .where(
                Job.is_active.is_(True),
                Job.created_at < thirty_days_ago,
            )
            .order_by(Job.created_at.asc())
            .limit(10)
        )
        stale_jobs = list(db.execute(stale_jobs_stmt).scalars().unique().all())
        stale_job_alerts = [
            {
                "job_id": j.id,
                "title": j.title,
                "company_name": j.employer.company_name or j.employer.full_name
                if j.employer
                else "N/A",
                "days_inactive": max(30, (now - j.created_at).days) if j.created_at else 30,
            }
            for j in stale_jobs
        ]

        # 3. Pending applications (> 14 days)
        fourteen_days_ago = now - timedelta(days=14)
        pending_apps_stmt = (
            select(Application)
            .options(
                joinedload(Application.candidate),
                joinedload(Application.job).joinedload(Job.employer),
            )
            .where(
                Application.status == "pending",
                Application.applied_at < fourteen_days_ago,
            )
            .order_by(Application.applied_at.asc())
            .limit(10)
        )
        pending_apps = list(db.execute(pending_apps_stmt).scalars().unique().all())
        pending_action_alerts = [
            {
                "application_id": a.id,
                "candidate_name": a.candidate.full_name if a.candidate else "N/A",
                "job_title": a.job.title if a.job else "N/A",
                "company_name": a.job.employer.company_name or a.job.employer.full_name
                if a.job and a.job.employer
                else "N/A",
                "days_pending": max(14, (now - a.applied_at).days) if a.applied_at else 14,
            }
            for a in pending_apps
        ]

        return {
            "ai_errors_24h": 0,
            "stale_jobs": stale_job_alerts,
            "overdue_interviews": overdue_alerts,
            "pending_actions": pending_action_alerts,
        }


crud_admin = CRUDAdmin()
