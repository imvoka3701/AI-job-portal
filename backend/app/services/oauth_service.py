"""OAuth Service — Google OAuth2 login flow using Authlib.

Flow:
  1. GET /auth/google/login → redirect to Google consent screen.
  2. User authorizes → Google redirects back to /auth/google/callback?code=….
  3. Backend exchanges code for token, fetches user info from Google.
  4. Find-or-create local User (by email), link OAuthAccount.
  5. Issue JWT token → redirect to frontend with token in query string.
"""

import logging
from datetime import datetime, timedelta, timezone

from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.user import crud_user
from app.models.oauth_account import OAuthAccount
from app.models.user import User, UserRole
from app.schemas.auth import Token, TokenPayload

logger = logging.getLogger(__name__)

# Google OAuth endpoints
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


class OAuthService:
    """Handles the Google OAuth2 authorization-code flow."""

    def get_authorization_url(self) -> str:
        """Build the Google OAuth consent URL the frontend redirects to."""
        client = AsyncOAuth2Client(
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
            scope="openid email profile",
        )
        url, _state = client.create_authorization_url(GOOGLE_AUTHORIZE_URL)
        return url

    async def handle_callback(self, db: Session, *, code: str) -> tuple[str, str]:
        """Process the OAuth callback, return (jwt_token, redirect_url).

        Raises HTTPException if the Google token exchange or userinfo fetch fails.
        """
        # 1. Exchange code for tokens
        try:
            async with AsyncOAuth2Client(
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                redirect_uri=settings.GOOGLE_REDIRECT_URI,
            ) as client:
                token_data = await client.fetch_token(
                    GOOGLE_TOKEN_URL,
                    code=code,
                )
        except Exception as exc:
            logger.exception("Failed to exchange Google OAuth code")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Google token exchange failed: {exc}",
            )

        access_token = token_data.get("access_token", "")
        id_token = token_data.get("id_token", "")

        # 2. Fetch user info from Google
        try:
            async with AsyncOAuth2Client(
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            ) as client:
                client.token = token_data
                userinfo = await client.get(GOOGLE_USERINFO_URL)
                userinfo.raise_for_status()
                user_data = userinfo.json()
        except Exception as exc:
            logger.exception("Failed to fetch Google user info")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Google userinfo fetch failed: {exc}",
            )

        google_id = user_data.get("sub")
        email = user_data.get("email")
        name = user_data.get("name", email.split("@")[0] if email else "Google User")
        picture = user_data.get("picture")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google did not return an email address.",
            )

        # 3. Find-or-create user
        user = self._find_or_create_user(
            db,
            email=email,
            full_name=name,
            picture=picture,
            google_id=google_id,
            access_token=access_token,
            id_token=id_token,
        )

        if not user.is_active:
            if user.role == UserRole.EMPLOYER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tài khoản nhà tuyển dụng đang chờ Admin duyệt. Vui lòng thử lại sau khi được phê duyệt.",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
            )

        # 4. Issue JWT
        jwt_token = self._create_access_token(TokenPayload(sub=user.id, role=user.role))

        # 5. Frontend redirect URL
        role_path = "/employer/dashboard" if user.role == UserRole.EMPLOYER else "/dashboard"
        frontend_url = f"{settings.FRONTEND_URL}/auth/google/callback?token={jwt_token}&redirect={role_path}"

        return jwt_token, frontend_url

    # ── Private helpers ──────────────────────────────────────────────────────

    def _find_or_create_user(
        self,
        db: Session,
        *,
        email: str,
        full_name: str,
        picture: str | None,
        google_id: str,
        access_token: str,
        id_token: str,
    ) -> User:
        """Find existing user by email, or create a new one. Then link the OAuth account."""
        # 1) Check if this Google account is already linked
        existing_oauth = (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.provider == "google",
                OAuthAccount.provider_user_id == google_id,
            )
            .first()
        )
        if existing_oauth:
            user = db.query(User).filter(User.id == existing_oauth.user_id).first()
            if user:
                return user

        # 2) Check if a user with this email already exists (local account)
        user = crud_user.get_by_email(db, email=email)

        if user:
            # Existing local user — link OAuth account
            if picture and not user.avatar_url:
                user.avatar_url = picture
                db.commit()
        else:
            # 3) Create new user (candidate by default, active since Google already verified)
            user = User(
                email=email,
                hashed_password="",  # OAuth users have no local password
                full_name=full_name,
                role=UserRole.CANDIDATE,
                avatar_url=picture,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 4) Link OAuth account (if not already linked)
        already_linked = (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.provider == "google",
                OAuthAccount.provider_user_id == google_id,
            )
            .first()
        )
        if not already_linked:
            oauth = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=google_id,
                email=email,
                access_token=access_token,
                id_token=id_token,
            )
            db.add(oauth)
            db.commit()

        return user

    def _create_access_token(self, payload: TokenPayload) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": str(payload.sub), "role": payload.role.value, "exp": expire}
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


oauth_service = OAuthService()
