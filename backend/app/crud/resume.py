"""CRUD operations for Resume model."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.schemas.resume import ResumeCreate


class CRUDResume:
    def get_by_id(self, db: Session, *, resume_id: int) -> Resume | None:
        return db.get(Resume, resume_id)

    def get_by_user(self, db: Session, *, user_id: int) -> list[Resume]:
        stmt = select(Resume).where(Resume.user_id == user_id)
        return list(db.execute(stmt).scalars().all())

    def create(self, db: Session, *, obj_in: ResumeCreate, user_id: int) -> Resume:
        resume = Resume(**obj_in.model_dump(), user_id=user_id)
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    def update(self, db: Session, *, resume: Resume, obj_in: dict) -> Resume:
        for field, value in obj_in.items():
            setattr(resume, field, value)
        db.commit()
        db.refresh(resume)
        return resume

    def update_embedding(self, db: Session, *, resume: Resume, embedding: list[float]) -> Resume:
        resume.embedding = embedding  # type: ignore[assignment]
        db.commit()
        db.refresh(resume)
        return resume

    def delete(self, db: Session, *, resume_id: int) -> None:
        resume = db.get(Resume, resume_id)
        if resume:
            db.delete(resume)
            db.commit()


crud_resume = CRUDResume()
