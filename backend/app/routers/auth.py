"""Auth router — login, register, OAuth endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    Token,
)
from app.schemas.user import UserRead
from app.services.auth_service import auth_service
from app.services.oauth_service import oauth_service, sign_oauth_state, verify_oauth_state

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


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request a new temporary password sent via email",
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    """Generate a secure new password, update DB, and deliver to user's email via SMTP."""
    try:
        msg = auth_service.forgot_password(db, email=data.email)
        return ForgotPasswordResponse(message=msg, email=data.email)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))



# ── Google OAuth ─────────────────────────────────────────────────────────────


@router.get(
    "/google/login",
    summary="Initiate Google OAuth login",
)
async def google_login() -> RedirectResponse:
    """Redirect user to Google's OAuth consent screen with CSRF state protection."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env",
        )
    auth_url, raw_state = oauth_service.get_authorization_url()
    signed_state = sign_oauth_state(raw_state)

    response = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="oauth_state",
        value=signed_state,
        httponly=True,
        samesite="lax",
        max_age=300,
        secure=False,
    )
    return response


@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback",
)
async def google_callback(
    request: Request,
    code: str = Query(..., description="Authorization code from Google"),
    state: str | None = Query(None, description="OAuth state parameter for CSRF mitigation"),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Exchange Google code for user info, create/find account, and redirect to FE with JWT."""
    cookie_state = request.cookies.get("oauth_state")
    if not verify_oauth_state(cookie_state, state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xác thực OAuth thất bại: State token không hợp lệ hoặc đã hết hạn.",
        )

    _, frontend_url = await oauth_service.handle_callback(db, code=code)
    response = RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)
    response.delete_cookie(key="oauth_state")
    return response
