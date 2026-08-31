"""
AI Job Portal — FastAPI Application Entry Point.

Creates the FastAPI app, configures CORS, and includes all routers.
"""

import json
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None

import logging
import logging.handlers

from app.config import settings
from app.database import get_db
from app.routers import (
    admin,
    admin_ai,
    ai,
    applications,
    assessments,
    auth,
    company_team,
    criteria_scores,
    cv_documents,
    email_webhooks,
    employer,
    interview_rounds,
    jobs,
    notifications,
    recruitment_requests,
    resumes,
    users,
)


class JSONLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def _configure_logging() -> None:
    """Configure root logger and ai_audit dedicated handler.

    - Root logger level is set from settings.LOG_LEVEL (default INFO).
    - 'ai_audit' logger is isolated so its JSON records don't pollute the
      main application log; optionally routes to a file for production ingestion.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger JSON formatter
    root_handler = logging.StreamHandler()
    root_handler.setFormatter(JSONLogFormatter(datefmt="%Y-%m-%dT%H:%M:%S"))

    logging.basicConfig(level=log_level, handlers=[root_handler])

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

    if settings.SENTRY_DSN and sentry_sdk:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=1.0,
        )
        logging.getLogger(__name__).info("Sentry initialized")

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

# --- Exception Handlers ---
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        # If detail is already a dict (e.g. custom structured error), use it directly as error
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    from fastapi.encoders import jsonable_encoder
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Dữ liệu không hợp lệ",
                "details": jsonable_encoder(exc.errors())
            }
        },
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logging.getLogger(__name__).exception("Database error")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "DATABASE_ERROR", "message": "Lỗi cơ sở dữ liệu nội bộ"}},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.getLogger(__name__).exception("Unhandled exception")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "Lỗi hệ thống nội bộ"}},
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
app.include_router(admin_ai.router)
app.include_router(assessments.router)

# --- Mount Static Files ---
Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root endpoint: API service info."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "docs": "/docs",
        "health": "/healthz",
    }


@app.get("/healthz", tags=["Health"])
async def healthz() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/readyz", tags=["Health"])
async def readyz(db: Session = Depends(get_db)) -> dict[str, str]:
    """Readiness probe. Checks DB connection."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "db": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        ) from e
