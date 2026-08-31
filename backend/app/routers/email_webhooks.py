"""Provider-neutral transactional email delivery webhooks."""

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.company import crud_company
from app.database import get_db
from app.schemas.company import InvitationBounceEvent
from app.services.company_service import company_service

router = APIRouter(prefix="/webhooks/email", tags=["Email Webhooks"])


@router.post(
    "/invitation-bounce",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Record a bounced invitation email",
)
def record_invitation_bounce(
    data: InvitationBounceEvent,
    x_webhook_secret: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Accept a normalized bounce event from the configured email provider adapter."""
    if not settings.EMAIL_BOUNCE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Bounce webhook chưa được cấu hình.")
    if not x_webhook_secret or not secrets.compare_digest(
        x_webhook_secret,
        settings.EMAIL_BOUNCE_WEBHOOK_SECRET,
    ):
        raise HTTPException(status_code=401, detail="Webhook secret không hợp lệ.")
    invitation = crud_company.get_invitation_by_message_id(db, message_id=data.message_id)
    if invitation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy email invitation.")
    company_service.mark_invitation_bounced(db, invitation=invitation, reason=data.reason)
    return {"status": "accepted"}
