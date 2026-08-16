"""CRUD operations for assessment attempts."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import AssessmentAttempt


async def create_attempt(
    db: AsyncSession,
    *,
    user_id: int,
    assessment_type: str,
    questionnaire_version: str,
    answers_json: dict[str, int],
    result_code: str,
    result_json: dict,
) -> AssessmentAttempt:
    """Create a new assessment attempt."""
    attempt = AssessmentAttempt(
        user_id=user_id,
        assessment_type=assessment_type,
        questionnaire_version=questionnaire_version,
        answers_json=answers_json,
        result_code=result_code,
        result_json=result_json,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


async def get_user_attempts(
    db: AsyncSession,
    *,
    user_id: int,
    assessment_type: str | None = None,
) -> list[AssessmentAttempt]:
    """Get all attempts for a user, optionally filtered by type."""
    query = select(AssessmentAttempt).where(AssessmentAttempt.user_id == user_id)
    if assessment_type:
        query = query.where(AssessmentAttempt.assessment_type == assessment_type)
    query = query.order_by(AssessmentAttempt.completed_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_attempt_by_id(
    db: AsyncSession,
    *,
    attempt_id: int,
) -> AssessmentAttempt | None:
    """Get a specific attempt by ID."""
    result = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    )
    return result.scalar_one_or_none()


async def delete_attempt(
    db: AsyncSession,
    *,
    attempt: AssessmentAttempt,
) -> None:
    """Delete an assessment attempt."""
    await db.delete(attempt)
    await db.commit()
