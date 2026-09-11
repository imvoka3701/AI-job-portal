"""CRUD operations for B2B Direct Chat."""

from datetime import datetime, timezone

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.chat import ChatMessage, Conversation
from app.models.company import Company, CompanyMembership, MembershipStatus
from app.models.job import Job
from app.models.user import User, UserRole


class CRUDChat:
    def get_conversation_by_id(self, db: Session, *, conversation_id: int) -> Conversation | None:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(
                joinedload(Conversation.application),
                joinedload(Conversation.job),
                joinedload(Conversation.candidate),
                joinedload(Conversation.company),
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_conversation_by_application(
        self, db: Session, *, application_id: int
    ) -> Conversation | None:
        stmt = (
            select(Conversation)
            .where(Conversation.application_id == application_id)
            .options(
                joinedload(Conversation.application),
                joinedload(Conversation.job),
                joinedload(Conversation.candidate),
                joinedload(Conversation.company),
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    def get_or_create_conversation(self, db: Session, *, application_id: int) -> Conversation:
        existing = self.get_conversation_by_application(db, application_id=application_id)
        if existing:
            return existing

        # Fetch application and associated job
        app = db.get(Application, application_id)
        if not app:
            raise ValueError(f"Application #{application_id} not found")

        job = db.get(Job, app.job_id)
        if not job:
            raise ValueError(f"Job #{app.job_id} not found")

        conv = Conversation(
            application_id=app.id,
            job_id=job.id,
            candidate_id=app.candidate_id,
            company_id=job.company_id,
            last_message_at=None,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return self.get_conversation_by_id(db, conversation_id=conv.id) or conv

    def user_has_access_to_conversation(
        self, db: Session, *, conversation: Conversation, user: User
    ) -> bool:
        """Check if user has permission to access the conversation.

        Zero-Knowledge Privacy: Only the direct candidate or authorized employer/company
        members can access messages. Admins CANNOT read private chat messages.
        """
        if conversation.candidate_id == user.id:
            return True

        # Check if user is job employer
        job = db.get(Job, conversation.job_id)
        if job and job.employer_id == user.id:
            return True

        # Check if user is member of the company
        if conversation.company_id:
            membership = db.execute(
                select(CompanyMembership).where(
                    CompanyMembership.company_id == conversation.company_id,
                    CompanyMembership.user_id == user.id,
                    CompanyMembership.status == MembershipStatus.ACTIVE,
                )
            ).scalar_one_or_none()
            if membership:
                return True

        return False

    def list_conversations_for_user(
        self,
        db: Session,
        *,
        user: User,
        company_id: int | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Conversation]:
        """List all conversations accessible to the given user."""
        stmt = select(Conversation).options(
            joinedload(Conversation.application),
            joinedload(Conversation.job),
            joinedload(Conversation.candidate),
            joinedload(Conversation.company),
            joinedload(Conversation.messages),
        )

        if user.role == UserRole.CANDIDATE:
            stmt = stmt.where(Conversation.candidate_id == user.id)
        else:
            # Employer / Company Member:
            # Conversations for company where user is active member OR jobs created by user
            user_company_ids = (
                db.execute(
                    select(CompanyMembership.company_id).where(
                        CompanyMembership.user_id == user.id,
                        CompanyMembership.status == MembershipStatus.ACTIVE,
                    )
                )
                .scalars()
                .all()
            )

            conditions = []
            if user_company_ids:
                if company_id and company_id in user_company_ids:
                    conditions.append(Conversation.company_id == company_id)
                elif not company_id:
                    conditions.append(Conversation.company_id.in_(user_company_ids))

            user_job_ids = (
                db.execute(select(Job.id).where(Job.employer_id == user.id)).scalars().all()
            )
            if user_job_ids:
                conditions.append(Conversation.job_id.in_(user_job_ids))

            if conditions:
                stmt = stmt.where(or_(*conditions))
            else:
                return []

        # Order by latest activity first
        stmt = (
            stmt.order_by(
                func.coalesce(Conversation.last_message_at, Conversation.created_at).desc()
            )
            .offset(skip)
            .limit(limit)
        )

        return list(db.execute(stmt).scalars().unique().all())

    def report_conversation(
        self,
        db: Session,
        *,
        conversation_id: int,
        reporter_id: int,
        reason: str,
    ) -> Conversation:
        """Report a conversation for harassment, fraud, or violations."""
        conv = db.get(Conversation, conversation_id)
        if not conv:
            raise ValueError(f"Conversation #{conversation_id} not found")
        conv.is_reported = True
        conv.report_reason = reason.strip()
        conv.reported_by_id = reporter_id
        conv.reported_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(conv)
        return conv

    def dismiss_report(self, db: Session, *, conversation_id: int) -> Conversation:
        """Dismiss a reported conversation after review."""
        conv = db.get(Conversation, conversation_id)
        if not conv:
            raise ValueError(f"Conversation #{conversation_id} not found")
        conv.is_reported = False
        conv.report_reason = None
        conv.reported_by_id = None
        conv.reported_at = None
        db.commit()
        db.refresh(conv)
        return conv

    def lock_conversation(self, db: Session, *, conversation_id: int, is_locked: bool) -> Conversation:
        """Lock or unlock a conversation for compliance/safety."""
        conv = db.get(Conversation, conversation_id)
        if not conv:
            raise ValueError(f"Conversation #{conversation_id} not found")
        conv.is_locked = is_locked
        db.commit()
        db.refresh(conv)
        return conv

    def list_conversations_for_admin(
        self,
        db: Session,
        *,
        is_reported: bool | None = None,
        is_locked: bool | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        """List conversation metadata for Admin oversight.

        Zero-Knowledge Privacy: Message contents (`ChatMessage.content`) are NEVER queried,
        serialized, or returned. Only metadata (counts, timestamps, participants, report flags).
        """
        msg_counts_sub = (
            select(
                ChatMessage.conversation_id,
                func.count(ChatMessage.id).label("message_count"),
            )
            .group_by(ChatMessage.conversation_id)
            .subquery()
        )

        base_query = (
            select(Conversation, func.coalesce(msg_counts_sub.c.message_count, 0).label("msg_count"))
            .outerjoin(msg_counts_sub, Conversation.id == msg_counts_sub.c.conversation_id)
            .join(Conversation.candidate)
            .outerjoin(Conversation.company)
            .join(Conversation.job)
        )

        if is_reported is not None:
            base_query = base_query.where(Conversation.is_reported == is_reported)
        if is_locked is not None:
            base_query = base_query.where(Conversation.is_locked == is_locked)
        if search:
            s = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    User.full_name.ilike(s),
                    User.email.ilike(s),
                    Company.name.ilike(s),
                    Job.title.ilike(s),
                )
            )

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = db.execute(count_stmt).scalar() or 0

        stmt = (
            base_query.options(
                joinedload(Conversation.candidate),
                joinedload(Conversation.company),
                joinedload(Conversation.job).joinedload(Job.employer),
                joinedload(Conversation.reported_by),
            )
            .order_by(
                Conversation.is_reported.desc(),
                func.coalesce(Conversation.last_message_at, Conversation.created_at).desc(),
            )
            .offset(skip)
            .limit(limit)
        )

        rows = db.execute(stmt).all()
        results = []
        for conv, msg_count in rows:
            candidate_name = conv.candidate.full_name or conv.candidate.email if conv.candidate else None
            employer_name = None
            employer_id = None
            if conv.job:
                employer_id = conv.job.employer_id
                if conv.job.employer:
                    employer_name = conv.job.employer.full_name or conv.job.employer.email

            reported_by_name = None
            if conv.reported_by:
                reported_by_name = conv.reported_by.full_name or conv.reported_by.email

            results.append(
                {
                    "id": conv.id,
                    "application_id": conv.application_id,
                    "job_id": conv.job_id,
                    "job_title": conv.job.title if conv.job else None,
                    "candidate_id": conv.candidate_id,
                    "candidate_name": candidate_name,
                    "candidate_email": conv.candidate.email if conv.candidate else None,
                    "company_id": conv.company_id,
                    "company_name": conv.company.name if conv.company else None,
                    "employer_id": employer_id,
                    "employer_name": employer_name,
                    "message_count": int(msg_count),
                    "is_locked": conv.is_locked,
                    "is_reported": conv.is_reported,
                    "report_reason": conv.report_reason,
                    "reported_by_name": reported_by_name,
                    "reported_at": conv.reported_at,
                    "created_at": conv.created_at,
                    "last_message_at": conv.last_message_at,
                }
            )

        return results, total

    def get_chat_stats_for_admin(self, db: Session) -> dict[str, int]:
        """Aggregate chat platform statistics for admin dashboard."""
        total_conversations = db.execute(select(func.count(Conversation.id))).scalar() or 0
        total_messages = db.execute(select(func.count(ChatMessage.id))).scalar() or 0
        reported_conversations = (
            db.execute(
                select(func.count(Conversation.id)).where(Conversation.is_reported == True)  # noqa: E712
            ).scalar()
            or 0
        )
        locked_conversations = (
            db.execute(
                select(func.count(Conversation.id)).where(Conversation.is_locked == True)  # noqa: E712
            ).scalar()
            or 0
        )

        now = datetime.now(timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        active_today = (
            db.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.last_message_at >= start_of_today
                )
            ).scalar()
            or 0
        )

        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "reported_conversations": reported_conversations,
            "locked_conversations": locked_conversations,
            "active_conversations_today": active_today,
        }

    def create_message(
        self,
        db: Session,
        *,
        conversation_id: int,
        sender_id: int,
        content: str,
    ) -> ChatMessage:
        conv = db.get(Conversation, conversation_id)
        if not conv:
            raise ValueError(f"Conversation #{conversation_id} not found")

        now = datetime.now(timezone.utc)
        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            is_read=False,
            created_at=now,
        )
        db.add(msg)
        conv.last_message_at = now
        conv.updated_at = now
        db.commit()
        db.refresh(msg)
        return msg

    def get_messages(
        self,
        db: Session,
        *,
        conversation_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .options(joinedload(ChatMessage.sender))
            .order_by(ChatMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    def mark_messages_read(self, db: Session, *, conversation_id: int, reader_id: int) -> int:
        """Mark unread messages in conversation not sent by reader_id as read."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ChatMessage)
            .where(
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.sender_id != reader_id,
                ChatMessage.is_read == False,  # noqa: E712
            )
            .values(is_read=True, read_at=now)
        )
        res = db.execute(stmt)
        db.commit()
        return res.rowcount or 0

    def count_unread_for_user(self, db: Session, *, conversation_id: int, user_id: int) -> int:
        stmt = select(func.count()).where(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.sender_id != user_id,
            ChatMessage.is_read == False,  # noqa: E712
        )
        return db.execute(stmt).scalar() or 0


crud_chat = CRUDChat()
