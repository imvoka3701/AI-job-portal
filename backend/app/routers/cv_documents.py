"""Candidate CV Builder endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.crud.cv_document import crud_cv_document
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.cv_document import CvDocumentCreate, CvDocumentRead, CvDocumentUpdate

router = APIRouter(prefix="/cv-documents", tags=["CV Documents"])
candidate_dependency = Depends(require_role(UserRole.CANDIDATE))


def _owned(document_id: int, current_user: User, db: Session):
    document = crud_cv_document.get_by_id(db, document_id=document_id, user_id=current_user.id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV không tồn tại")
    return document


@router.post("", response_model=CvDocumentRead, status_code=status.HTTP_201_CREATED)
def create_cv_document(data: CvDocumentCreate, current_user: User = candidate_dependency, db: Session = Depends(get_db)) -> CvDocumentRead:
    return crud_cv_document.create(db, data=data, user_id=current_user.id)


@router.get("/me", response_model=list[CvDocumentRead])
def list_cv_documents(current_user: User = candidate_dependency, db: Session = Depends(get_db)) -> list[CvDocumentRead]:
    return crud_cv_document.get_by_user(db, user_id=current_user.id)


@router.get("/{document_id}", response_model=CvDocumentRead)
def get_cv_document(document_id: int, current_user: User = candidate_dependency, db: Session = Depends(get_db)) -> CvDocumentRead:
    return _owned(document_id, current_user, db)


@router.patch("/{document_id}", response_model=CvDocumentRead)
def update_cv_document(document_id: int, data: CvDocumentUpdate, current_user: User = candidate_dependency, db: Session = Depends(get_db)) -> CvDocumentRead:
    return crud_cv_document.update(db, document=_owned(document_id, current_user, db), data=data)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cv_document(document_id: int, current_user: User = candidate_dependency, db: Session = Depends(get_db)) -> Response:
    crud_cv_document.delete(db, document=_owned(document_id, current_user, db))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

