"""AI Call Log model — records every Deepseek API call for admin monitoring."""

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func

from app.database import Base


class AIFeature(str, enum.Enum):
    MATCHING = "matching"              # local embedding, no Deepseek
    CV_EVALUATE = "cv_evaluate"
    ROADMAP = "roadmap"
    SUMMARIZE_CV = "summarize_cv"
    INTERVIEW_QUESTIONS = "interview_questions"
    GENERATE_EMAIL = "generate_email"


class AICallStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RETRIED_SUCCESS = "retried_success"


class AICallLog(Base):
    __tablename__ = "ai_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(Enum(AIFeature), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    related_id = Column(Integer, nullable=True)          # resume_id / job_id / application_id

    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    cost_usd = Column(Float, nullable=True)              # computed from token prices

    status = Column(Enum(AICallStatus), nullable=False)
    error_message = Column(String(500), nullable=True)   # truncated error, no full traceback
    duration_ms = Column(Integer, nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
