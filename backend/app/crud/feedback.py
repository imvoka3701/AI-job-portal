"""CRUD operations for User Feedback system."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.models.feedback import UserFeedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackUpdateAdmin


class CRUDFeedback:
    """Handles database transactions for user feedback and admin moderation."""

    def create(
        self, db: Session, *, data: FeedbackCreate, user: User | None = None
    ) -> UserFeedback:
        user_role = user.role.value if user else "guest"
        user_id = user.id if user else None

        db_obj = UserFeedback(
            user_id=user_id,
            user_role=user_role,
            sender_name=data.sender_name.strip(),
            sender_email=data.sender_email.strip().lower(),
            sender_phone=data.sender_phone.strip() if data.sender_phone else None,
            feedback_type=data.feedback_type,
            title=data.title.strip(),
            content=data.content.strip(),
            rating=data.rating,
            target_id=data.target_id.strip() if data.target_id else None,
            target_type=data.target_type.strip() if data.target_type else None,
            status="new",
            priority="urgent" if data.feedback_type == "job_report" else "medium",
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_id(self, db: Session, feedback_id: int) -> UserFeedback | None:
        return db.query(UserFeedback).filter(UserFeedback.id == feedback_id).first()

    def list_feedbacks(
        self,
        db: Session,
        *,
        user_role: str | None = None,
        feedback_type: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[UserFeedback], int]:
        query = db.query(UserFeedback)

        if user_role and user_role != "all":
            query = query.filter(UserFeedback.user_role == user_role)

        if feedback_type and feedback_type != "all":
            query = query.filter(UserFeedback.feedback_type == feedback_type)

        if status and status != "all":
            query = query.filter(UserFeedback.status == status)

        if priority and priority != "all":
            query = query.filter(UserFeedback.priority == priority)

        if search:
            kw = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(UserFeedback.title).like(kw),
                    func.lower(UserFeedback.content).like(kw),
                    func.lower(UserFeedback.sender_name).like(kw),
                    func.lower(UserFeedback.sender_email).like(kw),
                )
            )

        total = query.count()
        items = (
            query.order_by(
                # Urgent first, then new first, then latest created
                desc(UserFeedback.priority == "urgent"),
                desc(UserFeedback.status == "new"),
                desc(UserFeedback.created_at),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def update(
        self,
        db: Session,
        *,
        feedback_obj: UserFeedback,
        data: FeedbackUpdateAdmin,
        admin_user_id: int,
    ) -> UserFeedback:
        if data.status is not None:
            feedback_obj.status = data.status
            if data.status in ("resolved", "rejected"):
                feedback_obj.resolved_by = admin_user_id
                feedback_obj.resolved_at = datetime.now(timezone.utc)

        if data.priority is not None:
            feedback_obj.priority = data.priority

        if data.admin_notes is not None:
            feedback_obj.admin_notes = data.admin_notes

        if data.admin_response is not None:
            feedback_obj.admin_response = data.admin_response

        db.add(feedback_obj)
        db.commit()
        db.refresh(feedback_obj)
        return feedback_obj

    def get_stats(self, db: Session) -> dict[str, Any]:
        total = db.query(UserFeedback).count()
        pending = db.query(UserFeedback).filter(UserFeedback.status == "new").count()
        in_progress = (
            db.query(UserFeedback).filter(UserFeedback.status == "in_progress").count()
        )
        resolved = (
            db.query(UserFeedback).filter(UserFeedback.status == "resolved").count()
        )

        # Average rating from feedbacks that have a rating
        avg_rating = (
            db.query(func.avg(UserFeedback.rating))
            .filter(UserFeedback.rating.isnot(None))
            .scalar()
        )
        avg_csat = round(float(avg_rating), 1) if avg_rating else None

        # Group by role
        role_counts_raw = (
            db.query(UserFeedback.user_role, func.count(UserFeedback.id))
            .group_by(UserFeedback.user_role)
            .all()
        )
        by_role = {role: count for role, count in role_counts_raw}

        # Group by type
        type_counts_raw = (
            db.query(UserFeedback.feedback_type, func.count(UserFeedback.id))
            .group_by(UserFeedback.feedback_type)
            .all()
        )
        by_type = {ftype: count for ftype, count in type_counts_raw}

        return {
            "total_feedbacks": total,
            "pending_feedbacks": pending,
            "in_progress_feedbacks": in_progress,
            "resolved_feedbacks": resolved,
            "avg_csat_rating": avg_csat,
            "by_role": by_role,
            "by_type": by_type,
        }


crud_feedback = CRUDFeedback()
