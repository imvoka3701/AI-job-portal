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


class ResumeRead(ResumeBase):
    id: int
    file_url: str | None = None
    parsed_skills: str | None = None
    parsed_experience: str | None = None
    ai_evaluation_json: str | None = None
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
