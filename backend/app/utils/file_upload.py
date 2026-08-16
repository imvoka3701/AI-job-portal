"""File upload utilities for resume/CV files."""

import os
import uuid
from pathlib import Path
from typing import IO

from pypdf import PdfReader

UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".pdf"}  # PDF only
MAX_FILE_SIZE_MB = 5  # Max 5MB

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_IMAGE_SIZE_MB = 5

# Minimum text length extracted from PDF to consider it readable
MIN_EXTRACTED_TEXT_LENGTH = 50


def extract_text_from_pdf(file_stream: IO[bytes]) -> str:
    """Extract text content from a PDF file stream using PyPDF2.

    Args:
        file_stream: A binary file-like object positioned at the start of a PDF.

    Returns:
        The concatenated text extracted from all pages.

    Raises:
        ValueError: If no text can be extracted or the PDF appears to be a scan/image.
    """
    try:
        reader = PdfReader(file_stream)
        text_parts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())

        full_text = "\n\n".join(text_parts).strip()

        if len(full_text) < MIN_EXTRACTED_TEXT_LENGTH:
            raise ValueError(
                "Không đọc được nội dung CV. "
                "Vui lòng dùng file PDF có text, không phải ảnh scan."
            )

        return full_text

    except Exception as exc:
        # Re-raise ValueError as-is; wrap others
        if isinstance(exc, ValueError):
            raise
        raise ValueError(f"Không thể đọc file PDF: {exc}") from exc


def validate_file_extension(filename: str) -> bool:
    """Check if the file has an allowed extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def generate_upload_path(filename: str) -> Path:
    """Generate a unique file path for the uploaded file."""
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_path = UPLOAD_DIR / unique_name
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    return upload_path


def generate_user_upload_path(filename: str, user_id: int) -> Path:
    """Generate a unique file path under a user-specific folder."""
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_path = UPLOAD_DIR / str(user_id) / unique_name
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    return upload_path


async def save_file_upload(file, user_id: int) -> str:
    """Save uploaded file to disk and return the relative path.

    Args:
        file: A FastAPI/Starlette UploadFile instance.
        user_id: The ID of the uploading user.

    Returns:
        The relative file path as a string.

    Raises:
        ValueError: If the file type is not PDF or exceeds the size limit.
    """
    filename = file.filename or "untitled_resume"
    if not validate_file_extension(filename):
        raise ValueError(
            f"Định dạng file không hợp lệ. Chỉ chấp nhận PDF. "
            f"(Nhận được: {os.path.splitext(filename)[1] or 'không rõ'})"
        )

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(
            f"File quá lớn. Dung lượng tối đa là {MAX_FILE_SIZE_MB}MB."
        )

    upload_path = generate_user_upload_path(filename, user_id)
    upload_path.write_bytes(file_content)
    file.file.seek(0)  # Reset stream position for subsequent reads
    return f"/api/{upload_path.as_posix()}"


async def save_upload_file(file_content: bytes, filename: str) -> str:
    """Save uploaded file bytes to disk and return the relative path.

    Raises:
        ValueError: If the file type is not PDF or exceeds the size limit.
    """
    if not validate_file_extension(filename):
        raise ValueError(
            f"Định dạng file không hợp lệ. Chỉ chấp nhận PDF. "
            f"(Nhận được: {os.path.splitext(filename)[1] or 'không rõ'})"
        )

    if len(file_content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(
            f"File quá lớn. Dung lượng tối đa là {MAX_FILE_SIZE_MB}MB."
        )

    upload_path = generate_upload_path(filename)
    upload_path.write_bytes(file_content)
    return f"/api/{upload_path.as_posix()}"


async def save_avatar_upload(file, user_id: int) -> str:
    """Save an uploaded avatar image and return the URI path for the frontend."""
    filename = file.filename or "untitled_avatar.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        raise ValueError(
            f"Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP. "
            f"(Nhận được: {ext or 'không rõ'})"
        )

    file_content = await file.read()
    if len(file_content) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValueError(
            f"Ảnh quá lớn. Dung lượng tối đa là {MAX_IMAGE_SIZE_MB}MB."
        )

    unique_name = f"avatar_{uuid.uuid4().hex}{ext}"
    upload_path = UPLOAD_DIR / str(user_id) / unique_name
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    
    upload_path.write_bytes(file_content)
    file.file.seek(0)
    
    return f"/api/uploads/{user_id}/{unique_name}"
