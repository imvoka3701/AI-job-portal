"""Human-owned recommendation and final hiring decision workflow."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.crud.admin_audit_log import crud_admin_audit_log
from app.models.application import Application, ApplicationStatus, HiringRecommendation
from app.models.user import User
from app.schemas.application import ApplicationUpdate


class RecruitmentPipelineService:
    def update_status(
        self,
        db: Session,
        *,
        application: Application,
        data: ApplicationUpdate,
        actor: User,
    ) -> Application:
        previous_status = application.status
        if data.status is not None:
            application.status = data.status
        if data.decision_reason is not None:
            application.decision_reason = data.decision_reason.strip() or None
        if data.status in {ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED}:
            application.decision_by_id = actor.id
            application.decided_at = datetime.now(timezone.utc)
        elif data.status is not None:
            application.decision_by_id = None
            application.decided_at = None
            application.decision_reason = None
        self._audit(
            db,
            actor=actor,
            action="application.status_updated",
            application=application,
            details={
                "previous_status": previous_status.value,
                "new_status": application.status.value,
                "decision_reason": application.decision_reason,
            },
        )
        db.commit()
        db.refresh(application)
        return application

    def update_recommendation(
        self,
        db: Session,
        *,
        application: Application,
        recommendation: HiringRecommendation,
        note: str | None,
        actor: User,
    ) -> Application:
        application.hiring_recommendation = recommendation
        application.recommendation_note = note.strip() if note else None
        application.recommendation_by_id = actor.id
        application.recommended_at = datetime.now(timezone.utc)
        self._audit(
            db,
            actor=actor,
            action="application.recommendation_updated",
            application=application,
            details={
                "recommendation": recommendation.value,
                "note": application.recommendation_note,
            },
        )
        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def _audit(
        db: Session,
        *,
        actor: User,
        action: str,
        application: Application,
        details: dict,
    ) -> None:
        crud_admin_audit_log.create(
            db,
            actor_user_id=actor.id,
            actor_email=actor.email,
            action=action,
            target_type="application",
            target_id=str(application.id),
            target_label=f"Application #{application.id}",
            details={"job_id": application.job_id, **details},
        )


recruitment_pipeline_service = RecruitmentPipelineService()
