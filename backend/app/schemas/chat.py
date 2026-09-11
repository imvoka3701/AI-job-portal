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
    sender_avatar: str | None = None
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
    company_logo: str | None = None
    employer_id: int | None = None
    employer_name: str | None = None
    employer_avatar: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    is_locked: bool = False
    is_reported: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailOut(ConversationOut):
    messages: list[ChatMessageOut] = []


class ConversationReportRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000, description="Lý do báo cáo vi phạm hoặc quấy rối")


class AdminLockConversationRequest(BaseModel):
    is_locked: bool = Field(..., description="Khóa hoặc mở khóa cuộc trò chuyện")
    reason: str | None = Field(None, max_length=500, description="Lý do khóa / ghi chú can thiệp")


class AdminConversationSummaryOut(BaseModel):
    id: int
    application_id: int
    job_id: int
    job_title: str | None = None
    candidate_id: int
    candidate_name: str | None = None
    candidate_email: str | None = None
    company_id: int | None = None
    company_name: str | None = None
    employer_id: int | None = None
    employer_name: str | None = None
    message_count: int = 0
    is_locked: bool = False
    is_reported: bool = False
    report_reason: str | None = None
    reported_by_name: str | None = None
    reported_at: datetime | None = None
    created_at: datetime
    last_message_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminChatStatsOut(BaseModel):
    total_conversations: int
    total_messages: int
    reported_conversations: int
    locked_conversations: int
    active_conversations_today: int


class AdminConversationListResponse(BaseModel):
    items: list[AdminConversationSummaryOut]
    total: int
    skip: int
    limit: int

