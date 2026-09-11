"""Auth Service — handles registration, login, and JWT token management."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password, verify_password
from app.crud.user import crud_user
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, Token, TokenPayload
from app.schemas.user import UserCreate
from app.services.company_service import company_service


class AuthService:
    def register(self, db: Session, *, data: RegisterRequest) -> User:
        """Register a new user. Raises ValueError if email already exists.

        Employers default to is_active=False — they must be approved by an Admin
        before they can log in or use any employer features.
        """
        if data.role == UserRole.ADMIN:
            raise ValueError("Không thể tự đăng ký tài khoản Quản trị viên (Admin).")

        existing = crud_user.get_by_email(db, email=data.email)
        if existing:
            raise ValueError("Email already registered")

        user_in = UserCreate(
            email=data.email,
            password=data.password,
            full_name=data.full_name,
            role=data.role,
            company_name=data.company_name,
        )
        hashed = hash_password(data.password)
        user = crud_user.create(db, obj_in=user_in, hashed_password=hashed)

        # Employer accounts require admin approval before activation
        if user.role == UserRole.EMPLOYER:
            user.is_active = False
            db.commit()
            db.refresh(user)
            company_service.bootstrap_employer_company(db, user=user)

        return user

    def login(self, db: Session, *, data: LoginRequest) -> Token:
        """Authenticate user and return JWT token. Raises ValueError on failure."""
        user = crud_user.get_by_email(db, email=data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            if user.role == UserRole.EMPLOYER:
                raise ValueError(
                    "Tài khoản nhà tuyển dụng đang chờ Admin duyệt. "
                    "Vui lòng thử lại sau khi được phê duyệt."
                )
            raise ValueError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")

        access_token = self._create_access_token(
            TokenPayload(sub=user.id, role=user.role, token_version=user.token_version)
        )
        return Token(access_token=access_token)

    def _create_access_token(self, payload: TokenPayload) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {
            "sub": str(payload.sub),
            "role": payload.role.value,
            "token_version": payload.token_version,
            "exp": expire,
        }
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_token(self, token: str) -> TokenPayload:
        """Decode JWT token. Raises JWTError on invalid token."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return TokenPayload(
                sub=int(payload["sub"]),
                role=payload["role"],
                token_version=payload.get("token_version", 1),
            )
        except JWTError:
            raise

    def forgot_password(self, db: Session, *, email: str) -> str:
        """Issue a new temporary password, hash and save it to DB, and send it to user's email."""
        from app.services.password_reset_service import (
            generate_temporary_password,
            password_reset_service,
        )

        user = crud_user.get_by_email(db, email=email)
        if not user:
            raise ValueError("Không tìm thấy tài khoản tương ứng với email này trong hệ thống.")

        new_password = generate_temporary_password(length=10)
        user.hashed_password = hash_password(new_password)
        db.commit()
        db.refresh(user)

        password_reset_service.send_new_password(
            email=user.email,
            full_name=user.full_name,
            new_password=new_password,
        )
        return "Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư để đăng nhập."


auth_service = AuthService()
