"""
AI Job Portal — Application Settings.

Loads configuration from environment variables using pydantic-settings.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- App ---
    APP_NAME: str = "AI Job Portal"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"  # DEBUG | INFO | WARNING | ERROR
    # When set, ai_audit logger writes to this file instead of stdout
    AI_AUDIT_LOG_FILE: str = ""  # e.g. "/var/log/ai_audit.jsonl"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: object) -> object:
        """Accept common deployment labels without crashing settings loading."""
        if isinstance(value, str) and value.strip().lower() in {"release", "production", "prod"}:
            return False
        return value

    # --- Database ---
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_job_portal"

    # --- JWT / Auth ---
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # --- Frontend URL (for OAuth redirects) ---
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Transactional email / SMTP ---
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "AI Job Portal"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    SMTP_TIMEOUT_SECONDS: int = 10
    EMAIL_BOUNCE_WEBHOOK_SECRET: str = ""

    # --- AI / LLM ---
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    LLM_MODEL: str = "deepseek-chat"

    # --- OAuth / Google ---
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"


settings = Settings()
