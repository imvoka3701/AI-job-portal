"""CRUD operations for InterviewRound model."""

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.interview_round import InterviewRound, RoundStatus, RoundType


class CRUDInterviewRound:
    def get_by_id(self, db: Session, *, round_id: int) -> InterviewRound | None:
        return db.get(InterviewRound, round_id)

    def get_by_application(self, db: Session, *, application_id: int) -> list[InterviewRound]:
        stmt = (
            select(InterviewRound)
            .where(InterviewRound.application_id == application_id)
            .order_by(InterviewRound.round_number)
        )
        return list(db.execute(stmt).scalars().all())

    def create(
        self,
        db: Session,
        *,
        application_id: int,
        round_type: str = "custom",
        round_name: str | None = None,
        round_number: int | None = None,
    ) -> InterviewRound:
        """Create a new round. If round_number not given, auto-increments."""
        if round_number is None:
            existing = self.get_by_application(db, application_id=application_id)
            round_number = len(existing) + 1

        round_obj = InterviewRound(
            application_id=application_id,
            round_number=round_number,
            round_type=round_type,
            round_name=round_name or f"Vòng {round_number}: {round_type}",
            status=RoundStatus.PENDING.value,
        )
        db.add(round_obj)
        db.commit()
        db.refresh(round_obj)
        return round_obj

    def update(self, db: Session, *, db_obj: InterviewRound, data: dict) -> InterviewRound:
        """Update round fields. If status changed, sync back to Application.status."""
        old_status = db_obj.status
        for field, value in data.items():
            if value is not None:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)

        # Sync to Application.status when round status changes
        if "status" in data and data["status"] != old_status:
            self._sync_application_status(db, application_id=db_obj.application_id)

        return db_obj

    def cleanup_orphan_rounds(self, db: Session, *, application_id: int, to_status: str) -> None:
        """Set all pending/in_progress rounds to skipped/failed when app reaches terminal state."""
        if to_status == "accepted":
            orphan_status = RoundStatus.SKIPPED.value
        elif to_status == "rejected":
            orphan_status = RoundStatus.FAILED.value
        else:
            return

        db.execute(
            update(InterviewRound)
            .where(
                InterviewRound.application_id == application_id,
                InterviewRound.status.in_(
                    [RoundStatus.PENDING.value, RoundStatus.IN_PROGRESS.value]
                ),
            )
            .values(status=orphan_status)
        )
        db.commit()

    # ── Private ──────────────────────────────────────────────────────────────

    @staticmethod
    def _sync_application_status(db: Session, *, application_id: int) -> None:
        """Sync InterviewRound states → Application.status."""
        app = db.get(Application, application_id)
        if not app:
            return

        # Explicit human decisions (accepted, rejected) must never be overwritten by round updates
        terminal_statuses = {
            ApplicationStatus.ACCEPTED,
            ApplicationStatus.ACCEPTED.value,
            ApplicationStatus.REJECTED,
            ApplicationStatus.REJECTED.value,
        }
        if app.status in terminal_statuses:
            return

        rounds = (
            db.execute(
                select(InterviewRound)
                .where(InterviewRound.application_id == application_id)
                .order_by(InterviewRound.round_number)
            )
            .scalars()
            .all()
        )

        if not rounds:
            return

        # Round results inform HR; terminal decisions remain explicit human actions.
        if any(r.status == RoundStatus.FAILED.value for r in rounds):
            app.status = ApplicationStatus.INTERVIEW
        elif all(r.status == RoundStatus.PASSED.value for r in rounds):
            non_cv_rounds = [r for r in rounds if r.round_type != RoundType.CV_SCREEN.value]
            if len(rounds) >= 2 and len(non_cv_rounds) > 0:
                app.status = ApplicationStatus.SHORTLISTED
            elif rounds[0].round_type == RoundType.CV_SCREEN.value:
                app.status = ApplicationStatus.REVIEWED
            else:
                app.status = ApplicationStatus.SHORTLISTED
        else:
            # Find the current active round (first non-passed)
            current = next(
                (r for r in rounds if r.status != RoundStatus.PASSED.value),
                rounds[-1],
            )
            current_type = current.round_type or RoundType.CUSTOM.value
            status_map = {
                RoundType.CV_SCREEN.value: ApplicationStatus.REVIEWED,
                RoundType.TECH_INTERVIEW.value: ApplicationStatus.INTERVIEW,
                RoundType.HR_INTERVIEW.value: ApplicationStatus.SHORTLISTED,
                RoundType.FINAL.value: ApplicationStatus.INTERVIEW,
                RoundType.CUSTOM.value: ApplicationStatus.INTERVIEW,
            }
            app.status = status_map.get(current_type, ApplicationStatus.INTERVIEW)

        db.commit()


crud_interview_round = CRUDInterviewRound()
