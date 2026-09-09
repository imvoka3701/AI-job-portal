"""Pydantic schemas for B2B Direct Chat."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Message content")


class ChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str | None = None
    sender_role: str | None = None
    content: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationOut(BaseModel):
    id: int
    application_id: int
    job_id: int
    job_title: str | None = None
    candidate_id: int
    candidate_name: str | None = None
    candidate_avatar: str | None = None
    company_id: int | None = None
    company_name: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailOut(ConversationOut):
    messages: list[ChatMessageOut] = []
