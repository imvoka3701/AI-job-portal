"""CRUD for CriteriaScore model."""

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.criteria_score import CriteriaScore
from app.models.interview_round import InterviewRound


class CRUDCriteriaScore:
    def get_by_round(self, db: Session, *, round_id: int) -> list[CriteriaScore]:
        return list(
            db.execute(
                select(CriteriaScore).where(CriteriaScore.round_id == round_id)
            ).scalars().all()
        )

    def bulk_replace(self, db: Session, *, round_id: int, criteria: list[dict]) -> list[CriteriaScore]:
        """Delete existing criteria for round, insert new ones, update round.score."""
        # Delete old
        db.execute(delete(CriteriaScore).where(CriteriaScore.round_id == round_id))
        # Insert new
        results = []
        for c in criteria:
            cs = CriteriaScore(
                round_id=round_id,
                criteria_name=c["criteria_name"],
                score=c["score"],
                notes=c.get("notes"),
            )
            db.add(cs)
            results.append(cs)
        db.commit()
        for r in results:
            db.refresh(r)

        # Sync average to InterviewRound.score
        round_obj = db.get(InterviewRound, round_id)
        if round_obj and results:
            avg = sum(c.score for c in results) / len(results)
            round_obj.score = round(avg)
            db.commit()

        return results


crud_criteria_score = CRUDCriteriaScore()
