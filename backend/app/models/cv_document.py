"""Structured CV documents created in the CV Builder."""

import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CvDocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class CvDocument(Base):
    __tablename__ = "cv_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="CV của tôi")
    template_key: Mapped[str] = mapped_column(String(64), nullable=False, default="ats-minimal")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=CvDocumentStatus.DRAFT.value
    )
    content_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="cv_documents")
