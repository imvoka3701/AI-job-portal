"""OAuthAccount model — stores linked OAuth provider accounts (Google, etc.)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # FK to users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Provider info
    provider: Mapped[str] = mapped_column(String(50), nullable=False)          # "google"
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False) # Google's "sub" claim

    # Email snapshot at time of linking (may differ from user.email)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # OAuth tokens (optional — we don't always need to store, but useful for debugging)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    # Relationship
    user: Mapped["User"] = relationship(back_populates="oauth_accounts")  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:
        return f"<OAuthAccount {self.provider}:{self.provider_user_id} → user={self.user_id}>"
