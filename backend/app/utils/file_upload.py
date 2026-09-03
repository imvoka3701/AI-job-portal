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

# Minimum text length extracted from PDF to consider it readable (avoids 1-line or scan PDFs)
MIN_EXTRACTED_TEXT_LENGTH = 100

# Magic bytes (file signatures) used to verify real file content, independent of
# the (client-controlled) filename extension and Content-Type header.
PDF_MAGIC = b"%PDF-"
IMAGE_MAGIC_SIGNATURES: tuple[bytes, ...] = (
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"\xff\xd8\xff",  # JPEG / JPG
    b"RIFF",  # WEBP (RIFF....WEBP container)
)


def _enforce_max_size(content: bytes, max_mb: int, label: str = "File") -> None:
    """Raise ValueError if the byte content exceeds the allowed size."""
    if len(content) > max_mb * 1024 * 1024:
        raise ValueError(f"{label} quá lớn. Dung lượng tối đa là {max_mb}MB.")


def _verify_pdf_magic(content: bytes) -> None:
    """Verify the content really starts with the PDF signature."""
    if not content.startswith(PDF_MAGIC):
        raise ValueError(
            "Nội dung file không phải PDF hợp lệ (chữ ký file không khớp). "
            "Vui lòng tải lên đúng file PDF."
        )


def _verify_image_magic(content: bytes) -> None:
    """Verify the content matches a supported image signature."""
    if content.startswith(b"RIFF") and content[8:12] != b"WEBP":
        raise ValueError("Nội dung ảnh không hợp lệ (chữ ký file không khớp).")
    if not any(content.startswith(sig) for sig in IMAGE_MAGIC_SIGNATURES):
        raise ValueError("Nội dung ảnh không hợp lệ (chữ ký file không khớp).")


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
                "Nội dung CV quá ngắn hoặc không đọc được chữ (yêu cầu tối thiểu 100 ký tự). "
                "Vui lòng dùng file PDF chứa văn bản đầy đủ, không dùng ảnh chụp hoặc file rỗng."
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

    # Early reject oversized uploads using the reported size (avoids buffering
    # a huge payload in memory before checking).
    reported_size = getattr(file, "size", None)
    if reported_size is not None and reported_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File quá lớn. Dung lượng tối đa là {MAX_FILE_SIZE_MB}MB.")

    file_content = await file.read()
    _enforce_max_size(file_content, MAX_FILE_SIZE_MB)
    _verify_pdf_magic(file_content)

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

    _enforce_max_size(file_content, MAX_FILE_SIZE_MB)
    _verify_pdf_magic(file_content)

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

    reported_size = getattr(file, "size", None)
    if reported_size is not None and reported_size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"Ảnh quá lớn. Dung lượng tối đa là {MAX_IMAGE_SIZE_MB}MB.")

    file_content = await file.read()
    _enforce_max_size(file_content, MAX_IMAGE_SIZE_MB, label="Ảnh")
    _verify_image_magic(file_content)

    unique_name = f"avatar_{uuid.uuid4().hex}{ext}"
    upload_path = UPLOAD_DIR / str(user_id) / unique_name
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    upload_path.write_bytes(file_content)
    file.file.seek(0)

    return f"/api/uploads/{user_id}/{unique_name}"
