"""Auth router — login, register, OAuth endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserRead
from app.services.auth_service import auth_service
from app.services.oauth_service import oauth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> UserRead:
    """Create a new candidate or employer account."""
    try:
        user = auth_service.register(db, data=data)
        return UserRead.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post(
    "/login",
    response_model=Token,
    summary="Login and get JWT token",
)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Authenticate user and return access token."""
    try:
        return auth_service.login(db, data=data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


# ── Google OAuth ─────────────────────────────────────────────────────────────


@router.get(
    "/google/login",
    summary="Initiate Google OAuth login",
)
async def google_login() -> RedirectResponse:
    """Redirect user to Google's OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env",
        )
    auth_url = oauth_service.get_authorization_url()
    return RedirectResponse(url=auth_url)


@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback",
)
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Exchange Google code for user info, create/find account, and redirect to FE with JWT."""
    _, frontend_url = await oauth_service.handle_callback(db, code=code)
    return RedirectResponse(url=frontend_url)
