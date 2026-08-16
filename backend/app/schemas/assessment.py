"""Pydantic schemas for MBTI/MI assessment tools."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

AssessmentType = Literal["mbti", "mi"]


# ── Question & Questionnaire Schemas ───────────────────────────────────────────

class AssessmentQuestion(BaseModel):
    """A single question in the questionnaire."""
    id: str
    order: int
    text: str


class AssessmentQuestionnaire(BaseModel):
    """Full questionnaire returned to the client."""
    assessment_type: AssessmentType
    version: str
    title: str
    description: str
    questions: list[AssessmentQuestion]


# ── Scoring & Result Schemas ───────────────────────────────────────────────────

class AssessmentResult(BaseModel):
    """Calculated personality/intelligence result."""
    code: str
    title: str
    summary: str
    strengths: list[str]
    environments: list[str]
    career_ctas: list[str]
    dimensions: dict[str, float]


# ── Submission & Persistence Schemas ──────────────────────────────────────────

class AssessmentAttemptCreate(BaseModel):
    """Payload to score or persist an assessment attempt."""
    assessment_type: AssessmentType
    questionnaire_version: str
    answers: dict[str, int] = Field(
        ...,
        description="Map of question_id to Likert scale score (1 to 5)",
    )


class AssessmentAttemptRead(BaseModel):
    """Persisted assessment attempt record."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    assessment_type: AssessmentType
    questionnaire_version: str
    answers: dict[str, int]
    result: AssessmentResult | dict[str, Any]
    completed_at: datetime
    created_at: datetime
