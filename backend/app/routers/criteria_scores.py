"""Criteria Scores router — per-criteria scoring for interview rounds."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.company_permissions import (
    CompanyContext,
    CompanyPermission,
    require_application_scope,
    require_company_permission,
)
from app.crud.criteria_score import crud_criteria_score
from app.crud.interview_round import crud_interview_round
from app.database import get_db
from app.schemas.criteria_score import CriteriaBulkUpdate, CriteriaScoreRead

router = APIRouter(prefix="/rounds", tags=["Criteria Scores"])


@router.get("/{round_id}/criteria", response_model=list[CriteriaScoreRead], summary="Get criteria scores for a round")
def get_criteria(
    round_id: int,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.INTERVIEW_EVALUATE)
    ),
    db: Session = Depends(get_db),
):
    """Get all criteria scores for a specific interview round."""
    round_obj = crud_interview_round.get_by_id(db, round_id=round_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="Round not found")
    require_application_scope(db, context=context, application=round_obj.application)
    scores = crud_criteria_score.get_by_round(db, round_id=round_id)
    return [CriteriaScoreRead.model_validate(s) for s in scores]


@router.put("/{round_id}/criteria", response_model=list[CriteriaScoreRead], summary="Replace criteria scores for a round")
def replace_criteria(
    round_id: int,
    data: CriteriaBulkUpdate,
    context: CompanyContext = Depends(
        require_company_permission(CompanyPermission.INTERVIEW_EVALUATE)
    ),
    db: Session = Depends(get_db),
):
    """Replace all criteria scores for a round (deletes old, inserts new). Auto-syncs average to round.score."""
    round_obj = crud_interview_round.get_by_id(db, round_id=round_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="Round not found")
    require_application_scope(db, context=context, application=round_obj.application)
    round_obj.reviewer_id = context.user.id
    scores = crud_criteria_score.bulk_replace(
        db, round_id=round_id, criteria=[c.model_dump() for c in data.criteria],
    )
    return [CriteriaScoreRead.model_validate(s) for s in scores]
