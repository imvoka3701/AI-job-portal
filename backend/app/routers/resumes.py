"""Resumes router — upload and manage resumes."""

import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
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
        "Uploads a PDF resume, validates it is a real CV, extracts text, "
        "generates a vector embedding via sentence-transformers, and stores "
        "everything in the database. File is only persisted after validation passes."
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

    # ── 2. Extract text from PDF (BEFORE saving to disk) ─────────────────────
    # Read the file stream for text extraction first — avoid orphan files from
    # rejected uploads.
    file.file.seek(0)
    try:
        raw_text = extract_text_from_pdf(file.file)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # ── 3. Validate extracted text length ────────────────────────────────────
    if not raw_text or len(raw_text.strip()) < MIN_EXTRACTED_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Không đọc được nội dung CV. Vui lòng dùng file PDF có text, không phải ảnh scan."
            ),
        )

    # ── 4. Validate with AI (Standard CV format check) ───────────────────────
    try:
        res = await cv_evaluator_service.validate_is_cv(raw_text)
        if isinstance(res, tuple):
            is_valid_cv, reject_reason = res
        else:
            is_valid_cv, reject_reason = bool(res), ""
    except Exception as exc:
        logger.exception("CV validation failed for user %s", current_user.id)
        raise ai_http_exception(exc)
    if not is_valid_cv:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=reject_reason
            or "Hồ sơ tải lên không đúng định dạng CV tiêu chuẩn thị trường. Vui lòng tải lên file CV hợp lệ.",
        )

    # ── 4.5. Parse CV metadata (industry, skills, experience level) ──────────
    from app.services.cv_parser import cv_parser_service

    try:
        cv_metadata = await cv_parser_service.parse_cv_metadata(raw_text, db=db)
        category_id = cv_parser_service.resolve_category_id(cv_metadata.industry, db)
    except Exception as exc:
        logger.warning("CV metadata parsing failed (non-blocking): %s", exc)
        cv_metadata = None
        category_id = None

    # ── 5. Save file to disk (ONLY after validation passes) ──────────────────
    file.file.seek(0)
    try:
        file_location = await save_file_upload(file=file, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # ── 6. Generate embedding ────────────────────────────────────────────────
    try:
        embedding = generate_embedding(raw_text)
    except Exception as exc:
        logger.exception("Failed to generate embedding for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể tạo embedding cho CV: {exc}",
        )

    # ── 7. Create resume entry with embedding + validated flag + metadata ────
    import json as _json

    resume_in = ResumeCreate(
        title=file.filename or "untitled_resume",
        file_url=file_location,
        raw_text=raw_text,
        parsed_skills=None,
        parsed_experience=None,
        embedding=embedding,
        is_validated=True,
        validated_at=datetime.now(timezone.utc),
        # Structured CV metadata
        parsed_industry=cv_metadata.industry if cv_metadata else None,
        desired_role=cv_metadata.desired_role if cv_metadata else None,
        desired_location=cv_metadata.desired_location if cv_metadata else None,
        parsed_experience_level=cv_metadata.experience_level if cv_metadata else None,
        parsed_key_skills=_json.dumps(cv_metadata.key_skills, ensure_ascii=False)
        if cv_metadata and cv_metadata.key_skills
        else None,
        industry_category_id=category_id,
    )
    resume = crud_resume.create(db, obj_in=resume_in, user_id=current_user.id)
    logger.info(
        "Resume created: id=%s user=%s file=%s text_len=%s validated=True industry=%s",
        resume.id,
        current_user.id,
        resume.title,
        len(raw_text),
        cv_metadata.industry if cv_metadata else "unknown",
    )
    return ResumeRead.model_validate(resume)


@router.post(
    "",
    response_model=ResumeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resume entry",
)
async def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(require_role(UserRole.CANDIDATE)),
    db: Session = Depends(get_db),
) -> ResumeRead:
    """Create a new resume entry. File upload handled separately.

    If raw_text is provided, the CV is validated through the same AI pipeline
    as the upload endpoint to prevent invalid documents from entering the system.
    """
    # Validate CV content if raw_text is provided
    if data.raw_text and data.raw_text.strip():
        if len(data.raw_text.strip()) < MIN_EXTRACTED_TEXT_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nội dung CV quá ngắn. Vui lòng cung cấp CV đầy đủ.",
            )
        try:
            res = await cv_evaluator_service.validate_is_cv(data.raw_text)
            if isinstance(res, tuple):
                is_valid_cv, reject_reason = res
            else:
                is_valid_cv, reject_reason = bool(res), ""
        except Exception as exc:
            logger.exception("CV validation failed for user %s", current_user.id)
            raise ai_http_exception(exc)
        if not is_valid_cv:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=reject_reason or "Hồ sơ không đúng định dạng CV tiêu chuẩn.",
            )
        data.is_validated = True
        data.validated_at = datetime.now(timezone.utc)

        # Auto-generate embedding if not provided
        if data.embedding is None:
            try:
                data.embedding = generate_embedding(data.raw_text)
            except Exception:
                logger.warning(
                    "Could not pre-generate embedding during create_resume for user %s",
                    current_user.id,
                )

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
    if not resume.is_validated:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV chưa được xác thực. Vui lòng tải lên lại CV hợp lệ trước khi đánh giá.",
        )
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


def _resolve_resume_file_path(file_url: str | None) -> str | None:
    """Safely resolve the physical file path from a resume's stored file_url.

    Returns the resolved path if the file exists, or None.
    SECURITY: Never falls back to random/demo files — only returns the
    exact file belonging to this resume record.
    """
    if not file_url:
        return None

    # Try multiple path normalization strategies (handles /uploads/... vs uploads/...)
    candidate_paths = [
        file_url,
        file_url.lstrip("/"),
        file_url.replace("/api/", "/").lstrip("/"),
    ]
    # Also try prefixing with "uploads" if the stored path doesn't include it
    clean = file_url.replace("/api/", "/").lstrip("/")
    if not clean.startswith("uploads"):
        candidate_paths.append(os.path.join("uploads", clean))

    for p in candidate_paths:
        if p and os.path.exists(p) and os.path.isfile(p):
            return p
    return None


@router.get("/{resume_id}/content", summary="Get resume raw file content for preview")
def get_resume_content(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Serve resume PDF for in-browser preview (Content-Disposition: inline).

    Returns exactly the file belonging to this resume — never falls back to
    random or demo files (security fix).
    """
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")

    resolved_path = _resolve_resume_file_path(resume.file_url)
    if not resolved_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File CV không tồn tại trên server. Vui lòng tải lên lại.",
        )

    return FileResponse(
        path=resolved_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="CV_{resume_id}.pdf"'},
    )


@router.get("/{resume_id}/download", summary="Download resume file")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download resume PDF as a file attachment (triggers browser download).

    Unlike /content (inline preview), this endpoint sets
    Content-Disposition: attachment to force the browser to save the file.
    """
    resume = crud_resume.get_by_id(db, resume_id=resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume")

    resolved_path = _resolve_resume_file_path(resume.file_url)
    if not resolved_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File CV không tồn tại trên server. Vui lòng tải lên lại.",
        )

    # Use the original filename if available, otherwise generate a safe name
    download_name = (
        resume.title if resume.title and resume.title.endswith(".pdf") else f"CV_{resume_id}.pdf"
    )

    return FileResponse(
        path=resolved_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
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
