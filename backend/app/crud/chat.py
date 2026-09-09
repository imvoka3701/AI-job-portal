"""CRUD operations for B2B Direct Chat."""

from datetime import datetime, timezone

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.chat import ChatMessage, Conversation
from app.models.company import CompanyMembership, MembershipStatus
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
        """Check if user has permission to access the conversation."""
        if user.role == UserRole.ADMIN:
            return True

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

        if user.role == UserRole.ADMIN:
            # Admin sees all or filtered by company
            if company_id:
                stmt = stmt.where(Conversation.company_id == company_id)
        elif user.role == UserRole.CANDIDATE:
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
