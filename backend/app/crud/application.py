"""CRUD operations for Application model."""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.schemas.application import ApplicationCreate, ApplicationUpdate


class CRUDApplication:
    def get_by_id(self, db: Session, *, application_id: int) -> Application | None:
        return db.get(Application, application_id)

    def get_by_id_with_relations(self, db: Session, *, application_id: int) -> Application | None:
        """Get application with candidate, job+employer, and resume eagerly loaded."""
        stmt = (
            select(Application)
            .where(Application.id == application_id)
            .options(
                joinedload(Application.candidate),
                joinedload(Application.job).joinedload(Job.employer),
                joinedload(Application.resume),
                joinedload(Application.cv_document),
            )
        )
        return db.execute(stmt).scalars().unique().first()

    def get_by_candidate(self, db: Session, *, candidate_id: int) -> list[Application]:
        stmt = (
            select(Application)
            .where(Application.candidate_id == candidate_id)
            .options(joinedload(Application.job))
        )
        return list(db.execute(stmt).scalars().all())

    def get_by_job(self, db: Session, *, job_id: int) -> list[Application]:
        stmt = select(Application).where(Application.job_id == job_id)
        return list(db.execute(stmt).scalars().all())

    def get_by_resume(self, db: Session, *, resume_id: int) -> list[Application]:
        stmt = (
            select(Application)
            .where(Application.resume_id == resume_id)
            .options(joinedload(Application.job))
        )
        return list(db.execute(stmt).scalars().unique().all())

    def get_by_resume_and_job(
        self, db: Session, *, resume_id: int, job_id: int
    ) -> Application | None:
        stmt = (
            select(Application)
            .where(Application.resume_id == resume_id, Application.job_id == job_id)
            .options(joinedload(Application.job))
        )
        return db.execute(stmt).scalars().first()

    def get_by_job_with_candidates(self, db: Session, *, job_id: int) -> list[Application]:
        """Get applications for a job, eagerly loading candidate + resume relationships."""
        stmt = (
            select(Application)
            .where(Application.job_id == job_id)
            .options(
                joinedload(Application.candidate),
                joinedload(Application.resume),
                joinedload(Application.cv_document),
            )
        )
        return list(db.execute(stmt).scalars().unique().all())

    def create(self, db: Session, *, obj_in: ApplicationCreate, candidate_id: int) -> Application:
        application = Application(
            **obj_in.model_dump(),
            candidate_id=candidate_id,
            status=ApplicationStatus.PENDING,
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    def update(self, db: Session, *, db_obj: Application, obj_in: ApplicationUpdate) -> Application:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crud_application = CRUDApplication()
