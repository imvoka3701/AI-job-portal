"""Resume Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


class ResumeBase(BaseModel):
    title: str


class ResumeCreate(ResumeBase):
    file_url: str | None = None
    raw_text: str | None = None
    parsed_skills: str | None = None
    parsed_experience: str | None = None
    ai_evaluation_json: str | None = None
    embedding: list[float] | None = None
    is_validated: bool = False
    validated_at: datetime | None = None
    # Structured CV metadata
    parsed_industry: str | None = None
    desired_role: str | None = None
    desired_location: str | None = None
    parsed_experience_level: str | None = None
    parsed_key_skills: str | None = None  # JSON array string
    industry_category_id: int | None = None


class ResumeRead(ResumeBase):
    id: int
    file_url: str | None = None
    parsed_skills: str | None = None
    parsed_experience: str | None = None
    ai_evaluation_json: str | None = None
    is_validated: bool = False
    validated_at: datetime | None = None
    # Structured CV metadata
    parsed_industry: str | None = None
    desired_role: str | None = None
    desired_location: str | None = None
    parsed_experience_level: str | None = None
    parsed_key_skills: str | None = None
    industry_category_id: int | None = None
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
