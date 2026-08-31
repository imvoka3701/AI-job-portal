"""CRUD operations for structured CV documents."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cv_document import CvDocument
from app.schemas.cv_document import CvDocumentCreate, CvDocumentUpdate


class CRUDCvDocument:
    def get_by_id(
        self, db: Session, *, document_id: int, user_id: int | None = None
    ) -> CvDocument | None:
        stmt = select(CvDocument).where(CvDocument.id == document_id)
        if user_id is not None:
            stmt = stmt.where(CvDocument.user_id == user_id)
        return db.execute(stmt).scalar_one_or_none()

    def get_by_user(self, db: Session, *, user_id: int) -> list[CvDocument]:
        stmt = (
            select(CvDocument)
            .where(CvDocument.user_id == user_id)
            .order_by(CvDocument.updated_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    def create(self, db: Session, *, data: CvDocumentCreate, user_id: int) -> CvDocument:
        document = CvDocument(**data.model_dump(), user_id=user_id)
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    def update(self, db: Session, *, document: CvDocument, data: CvDocumentUpdate) -> CvDocument:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(document, field, value)
        db.commit()
        db.refresh(document)
        return document

    def delete(self, db: Session, *, document: CvDocument) -> None:
        db.delete(document)
        db.commit()


crud_cv_document = CRUDCvDocument()
