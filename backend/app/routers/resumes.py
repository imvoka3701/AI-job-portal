"""Resumes router — upload and manage resumes."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.crud.resume import crud_resume
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.resume import ResumeCreate, ResumeRead
from app.services.ai_errors import ai_http_exception
from app.services.cv_evaluator import cv_evaluator_service
from app.services.embedding_service import generate_embedding
from app.utils.file_upload import (
    MIN_EXTRACTED_TEXT_LENGTH,
    extract_text_from_pdf,
    save_file_upload,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes", tags=["Resumes"])

# Only PDF is accepted
ALLOWED_CONTENT_TYPES = {"application/pdf"}


@router.post(
    "/upload",
    response_model=ResumeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a resume (PDF) and generate AI embedding",
    description=(
        "Uploads a PDF resume, extracts text, generates a vector embedding "
        "via sentence-transformers, and stores everything in the database."
    ),
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file (PDF only, max 5 MB)"),
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> ResumeRead:
    """Upload a PDF resume, extract text, generate embedding, and create a resume entry."""

    # ── 1. Validate content type ─────────────────────────────────────────────
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hợp lệ. Chỉ chấp nhận file PDF.",
        )

    # ── 2. Save file to disk ─────────────────────────────────────────────────
    try:
        file_location = await save_file_upload(file=file, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # ── 3. Extract text from PDF ─────────────────────────────────────────────
    file.file.seek(0)
    try:
        raw_text = extract_text_from_pdf(file.file)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # ── 4. Validate extracted text ──────────────────────────────────────────
    if not raw_text or len(raw_text.strip()) < MIN_EXTRACTED_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Không đọc được nội dung CV. Vui lòng dùng file PDF có text, không phải ảnh scan."
            ),
        )

    # ── 4.5. Validate with AI (Standard CV format check) ────────────────────
    try:
        is_valid_cv = await cv_evaluator_service.validate_is_cv(raw_text)
        reject_reason = getattr(cv_evaluator_service, "_last_reject_reason", "")
    except Exception as exc:
        logger.exception("CV validation failed for user %s", current_user.id)
        raise ai_http_exception(exc)
    if not is_valid_cv:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=reject_reason or "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường (thiếu thông tin cá nhân, kinh nghiệm hoặc học vấn). Vui lòng tải lên file CV hợp lệ.",
        )

    # ── 5. Generate embedding ────────────────────────────────────────────────
    try:
        embedding = generate_embedding(raw_text)
    except Exception as exc:
        logger.exception("Failed to generate embedding for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể tạo embedding cho CV: {exc}",
        )

    # ── 6. Create resume entry with embedding ────────────────────────────────
    resume_in = ResumeCreate(
        title=file.filename or "untitled_resume",
        file_url=file_location,
        raw_text=raw_text,
        parsed_skills=None,
        parsed_experience=None,
        embedding=embedding,
    )
    resume = crud_resume.create(db, obj_in=resume_in, user_id=current_user.id)
    logger.info(
        "Resume created: id=%s user=%s file=%s text_len=%s",
        resume.id,
        current_user.id,
        resume.title,
        len(raw_text),
    )
    return ResumeRead.model_validate(resume)


@router.post(
    "",
    response_model=ResumeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resume entry",
)
def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> ResumeRead:
    """Create a new resume entry. File upload handled separately."""
    if data.embedding is None and data.raw_text and data.raw_text.strip():
        try:
            data.embedding = generate_embedding(data.raw_text)
        except Exception:
            logger.warning("Could not pre-generate embedding during create_resume for user %s", current_user.id)
    resume = crud_resume.create(db, obj_in=data, user_id=current_user.id)
    return ResumeRead.model_validate(resume)


@router.get("/me", response_model=list[ResumeRead], summary="My resumes")
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ResumeRead]:
    """List all resumes belonging to the current user."""
    resumes = crud_resume.get_by_user(db, user_id=current_user.id)
    return [ResumeRead.model_validate(r) for r in resumes]


@router.get("/{resume_id}", response_model=ResumeRead, summary="Get resume by ID")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeRead:
    """Get a single resume by ID."""
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")
    return ResumeRead.model_validate(resume)


@router.post("/{resume_id}/evaluate", response_model=ResumeRead, summary="Evaluate resume using AI")
async def evaluate_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeRead:
    """Evaluate a resume using AI and save the results."""
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")
    if not resume.raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Resume has no text content"
        )

    try:
        evaluation = await cv_evaluator_service.evaluate(resume_text=resume.raw_text, db=db)
        updated_resume = crud_resume.update(
            db, resume=resume, obj_in={"ai_evaluation_json": evaluation.model_dump_json()}
        )
        return ResumeRead.model_validate(updated_resume)
    except Exception as exc:
        logger.exception("Failed to evaluate resume %s", resume_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate resume: {exc}",
        )


import os

from fastapi.responses import FileResponse


@router.get("/{resume_id}/content", summary="Get resume raw file content safely")
def get_resume_content(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Serve resume file with application/pdf (or fallback demo PDF) to allow clean preview."""
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")

    file_path = resume.file_url or ""
    # Candidate paths to locate file
    candidate_paths = [
        file_path,
        file_path.lstrip("/"),
        os.path.join("uploads", file_path.lstrip("/")),
        os.path.join("uploads", os.path.basename(file_path)) if file_path else "",
        "uploads/demo_cv.pdf",
        "uploads/resumes/demo_cv.pdf",
    ]
    resolved_path = None
    for p in candidate_paths:
        if p and os.path.exists(p) and os.path.isfile(p):
            resolved_path = p
            break

    if not resolved_path:
        # Fallback to any existing sample PDF in uploads
        import glob
        existing_pdfs = glob.glob("uploads/**/*.pdf", recursive=True)
        if existing_pdfs:
            resolved_path = existing_pdfs[0]

    if not resolved_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server"
        )

    return FileResponse(
        path=resolved_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=CV_{resume_id}.pdf"},
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete resume")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a resume by ID, unlinking it from past applications so deletion succeeds cleanly."""
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")

    from app.models.application import Application

    try:
        # Unlink from applications so candidate can safely delete their CV profile
        db.query(Application).filter(Application.resume_id == resume_id).update({"resume_id": None})
        db.flush()

        crud_resume.delete(db, resume_id=resume_id)
        db.commit()

        # Safely delete local file if it is an uploaded user file (not shared demo file)
        if resume.file_url:
            file_candidate = resume.file_url.lstrip("/")
            if (
                os.path.exists(file_candidate)
                and os.path.isfile(file_candidate)
                and not file_candidate.endswith("demo_cv.pdf")
                and not file_candidate.startswith("uploads/resumes/")
            ):
                try:
                    os.remove(file_candidate)
                except OSError:
                    pass
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xoá CV này do ràng buộc dữ liệu. Vui lòng thử lại sau.",
        )
