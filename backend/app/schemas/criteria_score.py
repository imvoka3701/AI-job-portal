"""CriteriaScore Pydantic schemas."""

from pydantic import BaseModel


class CriteriaScoreCreate(BaseModel):
    criteria_name: str
    score: int  # 0-10
    notes: str | None = None


class CriteriaScoreRead(BaseModel):
    id: int
    round_id: int
    criteria_name: str
    score: int
    notes: str | None = None

    model_config = {"from_attributes": True}


class CriteriaBulkUpdate(BaseModel):
    """Batch update all criteria for a round."""
    criteria: list[CriteriaScoreCreate]
