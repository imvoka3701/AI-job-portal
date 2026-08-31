"""InterviewRound Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


class RoundCreate(BaseModel):
    round_type: str = "custom"  # cv_screen | tech | hr | final | custom
    round_name: str | None = None


class RoundUpdate(BaseModel):
    status: str | None = None  # pending | in_progress | passed | failed | skipped
    scheduled_at: datetime | None = None
    location: str | None = None
    notes: str | None = None
    # score is computed automatically from criteria_scores average — not settable manually
    feedback: str | None = None


class RoundRead(BaseModel):
    id: int
    application_id: int
    round_number: int
    round_type: str
    round_name: str | None = None
    status: str
    scheduled_at: datetime | None = None
    location: str | None = None
    notes: str | None = None
    score: int | None = None
    feedback: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
