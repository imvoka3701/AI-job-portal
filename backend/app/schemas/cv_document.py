"""Schemas for structured CV Builder documents."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.cv_document import CvDocumentStatus

ALLOWED_TEMPLATES = {"ats-minimal", "modern-two-column", "professional-blue", "executive", "creative-clean"}


def default_cv_content() -> dict[str, Any]:
    return {
        "version": 1,
        "personal": {"full_name": "", "headline": "", "email": "", "phone": "", "location": "", "website": ""},
        "summary": "", "skills": [], "experience": [], "education": [], "projects": [],
        "certifications": [], "languages": [], "links": {"github": "", "linkedin": "", "portfolio": ""},
    }


class CvDocumentCreate(BaseModel):
    title: str = Field(default="CV của tôi", min_length=1, max_length=255)
    template_key: str = "ats-minimal"
    status: CvDocumentStatus = CvDocumentStatus.DRAFT
    content_json: dict[str, Any] = Field(default_factory=default_cv_content)

    @field_validator("template_key")
    @classmethod
    def validate_template(cls, value: str) -> str:
        if value not in ALLOWED_TEMPLATES:
            raise ValueError("Mẫu CV không hợp lệ")
        return value


class CvDocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    template_key: str | None = None
    status: CvDocumentStatus | None = None
    content_json: dict[str, Any] | None = None

    @field_validator("template_key")
    @classmethod
    def validate_template(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_TEMPLATES:
            raise ValueError("Mẫu CV không hợp lệ")
        return value


class CvDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    template_key: str
    status: CvDocumentStatus
    content_json: dict[str, Any]
    created_at: datetime
    updated_at: datetime

