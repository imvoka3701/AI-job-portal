"""AI Prompt Config model — admin-editable system prompts per AI feature."""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func

from app.database import Base


class AIPromptConfig(Base):
    __tablename__ = "ai_prompt_configs"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String(50), nullable=False, unique=True, index=True)
    system_prompt = Column(Text, nullable=False, default="")
    user_prompt_template = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
