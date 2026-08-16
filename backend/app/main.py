"""
AI Job Portal — FastAPI Application Entry Point.

Creates the FastAPI app, configures CORS, and includes all routers.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.routers import admin, ai, applications, assessments, auth, company_team, criteria_scores, cv_documents, email_webhooks, employer, interview_rounds, jobs, notifications, recruitment_requests, resumes, users


import logging
import logging.handlers


def _configure_logging() -> None:
    """Configure root logger and ai_audit dedicated handler.

    - Root logger level is set from settings.LOG_LEVEL (default INFO).
    - 'ai_audit' logger is isolated so its JSON records don't pollute the
      main application log; optionally routes to a file for production ingestion.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    # ai_audit logger emits structured JSON — give it its own handler
    audit_logger = logging.getLogger("ai_audit")
    audit_logger.propagate = False  # don't double-emit to root logger

    if settings.AI_AUDIT_LOG_FILE:
        # Production: write to a rotating JSON lines file
        file_handler = logging.handlers.RotatingFileHandler(
            settings.AI_AUDIT_LOG_FILE,
            maxBytes=50 * 1024 * 1024,  # 50 MB per file
            backupCount=10,
            encoding="utf-8",
        )
        file_handler.setFormatter(logging.Formatter("%(message)s"))
        audit_logger.addHandler(file_handler)
    else:
        # Dev / Docker default: write to stdout alongside app logs
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(logging.Formatter("%(message)s"))
        audit_logger.addHandler(stream_handler)

    audit_logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup & shutdown events."""
    # --- Startup ---
    _configure_logging()
    print(f"{settings.APP_NAME} starting up...")
    yield
    # --- Shutdown ---
    print(f"{settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Job Portal — RESTful API with LLM integration",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(interview_rounds.router)
app.include_router(criteria_scores.router)
app.include_router(resumes.router)
app.include_router(cv_documents.router)
app.include_router(ai.router)
app.include_router(employer.router)
app.include_router(company_team.router)
app.include_router(recruitment_requests.router)
app.include_router(email_webhooks.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(assessments.router)

# --- Mount Static Files ---
Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}
