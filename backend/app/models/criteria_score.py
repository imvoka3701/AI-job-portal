"""CriteriaScore model — individual criteria ratings per interview round."""

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CriteriaScore(Base):
    __tablename__ = "round_criteria_scores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    round_id: Mapped[int] = mapped_column(
        ForeignKey("interview_rounds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    criteria_name: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 10", name="ck_criteria_score_range"),
    )

    # Relationship
    round: Mapped["InterviewRound"] = relationship(back_populates="criteria_scores")  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<CriteriaScore {self.criteria_name}={self.score}/10 round={self.round_id}>"
