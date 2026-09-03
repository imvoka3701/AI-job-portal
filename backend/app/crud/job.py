"""CRUD operations for Job model."""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.job import ExperienceLevel, Job, JobType
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate
from app.utils.locations import expand_location_patterns, normalize_locations


class CRUDJob:
    def get_by_id(self, db: Session, *, job_id: int) -> Job | None:
        return db.get(Job, job_id)

    def get_by_ids_for_company(
        self,
        db: Session,
        *,
        job_ids: list[int],
        company_id: int,
    ) -> list[Job]:
        if not job_ids:
            return []
        return list(
            db.execute(
                select(Job).where(
                    Job.id.in_(job_ids),
                    Job.company_id == company_id,
                )
            )
            .scalars()
            .all()
        )

    def _apply_filters(
        self,
        stmt,
        *,
        keyword: str | None = None,
        locations: list[str] | None = None,
        job_type: JobType | None = None,
        experience_level: ExperienceLevel | None = None,
        salary_min: int | None = None,
        salary_max: int | None = None,
        category_id: int | None = None,
        employer_id: int | None = None,
        company_id: int | None = None,
    ):
        if keyword:
            pattern = f"%{keyword.strip()}%"
            stmt = stmt.join(User, Job.employer_id == User.id).where(
                or_(
                    Job.title.ilike(pattern),
                    Job.description.ilike(pattern),
                    Job.requirements.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.company_name.ilike(pattern),
                )
            )

        if locations:
            location_conditions = []
            for location in normalize_locations(locations):
                for term in expand_location_patterns(location):
                    location_conditions.append(Job.location.ilike(f"%{term}%"))
            if location_conditions:
                stmt = stmt.where(or_(*location_conditions))

        if job_type is not None:
            stmt = stmt.where(Job.job_type == job_type)

        if experience_level is not None:
            stmt = stmt.where(Job.experience_level == experience_level)

        if salary_min is not None:
            stmt = stmt.where(or_(Job.salary_max.is_(None), Job.salary_max >= salary_min))

        if salary_max is not None:
            stmt = stmt.where(or_(Job.salary_min.is_(None), Job.salary_min <= salary_max))

        if category_id is not None:
            stmt = stmt.where(Job.category_id == category_id)

        if employer_id is not None:
            stmt = stmt.where(Job.employer_id == employer_id)

        if company_id is not None:
            stmt = stmt.where(Job.company_id == company_id)

        return stmt

    def get_list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        is_active: bool = True,
        keyword: str | None = None,
        locations: list[str] | None = None,
        job_type: JobType | None = None,
        experience_level: ExperienceLevel | None = None,
        salary_min: int | None = None,
        salary_max: int | None = None,
        category_id: int | None = None,
        employer_id: int | None = None,
        company_id: int | None = None,
    ) -> tuple[list[Job], int]:
        base = select(Job).where(Job.is_active == is_active)
        filtered = self._apply_filters(
            base,
            keyword=keyword,
            locations=locations,
            job_type=job_type,
            experience_level=experience_level,
            salary_min=salary_min,
            salary_max=salary_max,
            category_id=category_id,
            employer_id=employer_id,
            company_id=company_id,
        )

        count_stmt = select(func.count()).select_from(filtered.subquery())
        total = db.execute(count_stmt).scalar() or 0

        items_stmt = (
            filtered.options(joinedload(Job.employer))
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(db.execute(items_stmt).scalars().unique().all())
        return items, total

    def create(
        self,
        db: Session,
        *,
        obj_in: JobCreate,
        employer_id: int,
        company_id: int | None = None,
    ) -> Job:
        data = obj_in.model_dump()
        data.pop("recruitment_request_id", None)
        data["is_active"] = True
        job = Job(**data, employer_id=employer_id, company_id=company_id)
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def update(self, db: Session, *, db_obj: Job, obj_in: JobUpdate) -> Job:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_embedding(self, db: Session, *, job: Job, embedding: list[float]) -> Job:
        job.embedding = embedding  # type: ignore[assignment]
        db.commit()
        db.refresh(job)
        return job

    def delete(self, db: Session, *, job_id: int) -> Job | None:
        """Delete or archive job.

        If the job has existing candidate applications, soft-deletes (archives) it by setting
        `is_active = False` to preserve candidate audit history and prevent PostgreSQL FK violations.
        If the job has no applications, hard-deletes it.
        """
        job = db.get(Job, job_id)
        if not job:
            return None

        has_applications = (
            db.execute(
                select(func.count()).select_from(Application).where(Application.job_id == job_id)
            ).scalar()
            or 0
        ) > 0

        if has_applications:
            job.is_active = False
            db.commit()
            db.refresh(job)
            return job

        db.delete(job)
        db.commit()
        return None


crud_job = CRUDJob()
