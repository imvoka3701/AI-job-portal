"""ContactLead model — stores enterprise consultation inquiry leads."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ContactLead(Base):
    """Stores business consultation requests submitted from employer landing pages."""

    __tablename__ = "contact_leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    service_package: Mapped[str] = mapped_column(String(50), default="pro", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="new", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ContactLead {self.full_name} ({self.company_name}) [{self.service_package}]>"
