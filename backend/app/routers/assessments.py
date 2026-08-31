"""Public MBTI/MI questionnaires and candidate-owned attempt history."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.models.assessment import AssessmentAttempt
from app.models.user import User, UserRole
from app.schemas.assessment import (
    AssessmentAttemptCreate,
    AssessmentAttemptRead,
    AssessmentQuestion,
    AssessmentQuestionnaire,
    AssessmentResult,
    AssessmentType,
)
from app.services.assessment_engine import get_questions, get_version, score_assessment

router = APIRouter(prefix="/tools", tags=["Assessments"])
candidate_dependency = Depends(require_role(UserRole.CANDIDATE))


def _questionnaire(assessment_type: AssessmentType) -> AssessmentQuestionnaire:
    questions = get_questions(assessment_type)
    title = (
        "Trắc nghiệm MBTI"
        if assessment_type == "mbti"
        else "Trắc nghiệm trí thông minh đa dạng (MI)"
    )
    return AssessmentQuestionnaire(
        assessment_type=assessment_type,
        version=get_version(assessment_type),
        title=title,
        description="Công cụ tự đánh giá định hướng nghề nghiệp, không phải chẩn đoán tâm lý.",
        questions=[
            AssessmentQuestion(id=item.id, order=index, text=item.text)
            for index, item in enumerate(questions, 1)
        ],
    )


@router.get(
    "/{assessment_type}/questions",
    response_model=AssessmentQuestionnaire,
    summary="Get a public assessment questionnaire",
)
def get_assessment_questions(assessment_type: AssessmentType) -> AssessmentQuestionnaire:
    return _questionnaire(assessment_type)


@router.post(
    "/{assessment_type}/score",
    response_model=AssessmentResult,
    summary="Score a public assessment without storing it",
)
def score_public_assessment(
    assessment_type: AssessmentType, data: AssessmentAttemptCreate
) -> AssessmentResult:
    """Score guest attempts without persisting personally identifiable data."""
    if data.assessment_type != assessment_type:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Loại bài test không khớp."
        )
    return score_assessment(assessment_type, data.questionnaire_version, data.answers)


@router.post(
    "/{assessment_type}/attempts",
    response_model=AssessmentAttemptRead,
    status_code=status.HTTP_201_CREATED,
    summary="Save a completed assessment",
)
def save_assessment_attempt(
    assessment_type: AssessmentType,
    data: AssessmentAttemptCreate,
    current_user: User = candidate_dependency,
    db: Session = Depends(get_db),
) -> AssessmentAttemptRead:
    if data.assessment_type != assessment_type:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Loại bài test không khớp."
        )
    result = score_assessment(assessment_type, data.questionnaire_version, data.answers)
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_type=assessment_type,
        questionnaire_version=data.questionnaire_version,
        answers_json=data.answers,
        result_code=result.code,
        result_json=result.model_dump(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return AssessmentAttemptRead(
        id=attempt.id,
        assessment_type=assessment_type,
        questionnaire_version=attempt.questionnaire_version,
        answers=attempt.answers_json,
        result=result,
        completed_at=attempt.completed_at,
        created_at=attempt.created_at,
    )


@router.get(
    "/attempts/me", response_model=list[AssessmentAttemptRead], summary="List my assessment history"
)
def list_my_assessments(
    assessment_type: AssessmentType | None = None,
    current_user: User = candidate_dependency,
    db: Session = Depends(get_db),
) -> list[AssessmentAttemptRead]:
    stmt = (
        select(AssessmentAttempt)
        .where(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.completed_at.desc())
    )
    if assessment_type:
        stmt = stmt.where(AssessmentAttempt.assessment_type == assessment_type)
    attempts = db.execute(stmt).scalars().all()
    return [
        AssessmentAttemptRead(
            id=item.id,
            assessment_type=item.assessment_type,
            questionnaire_version=item.questionnaire_version,
            answers=item.answers_json,
            result=item.result_json,
            completed_at=item.completed_at,
            created_at=item.created_at,
        )
        for item in attempts
    ]


@router.delete(
    "/attempts/{attempt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete my assessment history item",
)
def delete_assessment_attempt(
    attempt_id: int, current_user: User = candidate_dependency, db: Session = Depends(get_db)
) -> Response:
    attempt = db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id, AssessmentAttempt.user_id == current_user.id
        )
    ).scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kết quả không tồn tại.")
    db.delete(attempt)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
