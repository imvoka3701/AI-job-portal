from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatContext(BaseModel):
    current_path: str = Field(default="/", description="URL path of the page the user is currently on")
    selected_job_id: Optional[int] = Field(default=None, description="Current job ID if viewing a job detail page")
    role: Optional[str] = Field(default=None, description="User role if authenticated: candidate, employer, admin")


class EmbeddedCard(BaseModel):
    card_type: Literal["job", "tool", "action", "info"]
    title: str
    subtitle: Optional[str] = None
    url: str
    meta: Optional[Dict[str, Any]] = None


class AssistantChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[ChatContext] = None


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_cards: List[EmbeddedCard] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)


class AssistantQuickSuggestion(BaseModel):
    label: str
    prompt: str
    category: Literal["job_search", "cv_help", "interview", "employer_jd", "tools", "general"]
