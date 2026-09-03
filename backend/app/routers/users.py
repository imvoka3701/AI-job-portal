"""Users router — profile management endpoints."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.user import crud_user
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import PublicUserRead, UserRead, UserUpdate
from app.utils.file_upload import save_avatar_upload

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """Return the authenticated user's profile."""
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead, summary="Update current user profile")
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    """Update the authenticated user's profile."""
    updated = crud_user.update(db, db_obj=current_user, obj_in=data)
    return UserRead.model_validate(updated)


@router.post("/me/avatar", response_model=UserRead, summary="Upload user avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    """Upload and update the authenticated user's avatar."""
    try:
        avatar_url = await save_avatar_upload(file, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    updated = crud_user.update(db, db_obj=current_user, obj_in=UserUpdate(avatar_url=avatar_url))
    return UserRead.model_validate(updated)


@router.get(
    "/{user_id}",
    response_model=UserRead | PublicUserRead,
    summary="Get user by ID",
)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead | PublicUserRead:
    """Return a user's profile by ID.

    Full contact details (email, phone) are only visible to the user themselves or an admin.
    Other authenticated users receive a redacted public profile without PII.
    """
    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if current_user.id == user.id or current_user.role == UserRole.ADMIN:
        return UserRead.model_validate(user)
    return PublicUserRead.model_validate(user)

