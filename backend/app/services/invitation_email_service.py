"""SMTP delivery for employer team invitations."""

import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from html import escape

from app.config import settings
from app.models.company import CompanyInvitation, InvitationDeliveryStatus


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class InvitationDeliveryResult:
    status: InvitationDeliveryStatus
    message_id: str | None = None
    error: str | None = None


class InvitationEmailService:
    @property
    def configured(self) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)

    def send(self, invitation: CompanyInvitation, *, token: str) -> InvitationDeliveryResult:
        if not self.configured:
            return InvitationDeliveryResult(InvitationDeliveryStatus.NOT_CONFIGURED)

        message_id = make_msgid(domain=settings.SMTP_FROM_EMAIL.split("@")[-1])
        accept_url = f"{settings.FRONTEND_URL.rstrip('/')}/employer/invitations/{token}/accept"
        role_label = "Nhân sự" if invitation.member_role.value == "hr" else "Trưởng bộ phận"
        department_line = (
            f" tại phòng ban {invitation.department.name}" if invitation.department else ""
        )
        subject = f"Lời mời tham gia {invitation.company.name} trên AI Job Portal"

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
        message["To"] = invitation.email
        message["Message-ID"] = message_id
        message.set_content(
            f"Bạn được mời tham gia {invitation.company.name} với vai trò "
            f"{role_label}{department_line}.\n\n"
            f"Chấp nhận lời mời: {accept_url}\n\n"
            "Liên kết có hiệu lực trong 7 ngày."
        )
        message.add_alternative(
            "<html><body>"
            f"<h2>Lời mời tham gia {escape(invitation.company.name)}</h2>"
            f"<p>Bạn được mời với vai trò <strong>{escape(role_label)}</strong>"
            f"{escape(department_line)}.</p>"
            f'<p><a href="{escape(accept_url)}">Chấp nhận lời mời</a></p>'
            "<p>Liên kết có hiệu lực trong 7 ngày.</p>"
            "</body></html>",
            subtype="html",
        )

        try:
            smtp_class = smtplib.SMTP_SSL if settings.SMTP_USE_SSL else smtplib.SMTP
            with smtp_class(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=settings.SMTP_TIMEOUT_SECONDS,
            ) as smtp:
                if settings.SMTP_USE_TLS and not settings.SMTP_USE_SSL:
                    smtp.starttls()
                if settings.SMTP_USERNAME:
                    smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                rejected = smtp.send_message(message)
                if invitation.email in rejected:
                    raise smtplib.SMTPRecipientsRefused(rejected)
        except (OSError, smtplib.SMTPException):
            logger.exception("Invitation SMTP delivery failed for invitation %s", invitation.id)
            return InvitationDeliveryResult(
                InvitationDeliveryStatus.FAILED,
                message_id=message_id,
                error="SMTP không chấp nhận email. Vui lòng kiểm tra cấu hình hoặc thử lại.",
            )

        return InvitationDeliveryResult(
            InvitationDeliveryStatus.SENT,
            message_id=message_id,
        )


invitation_email_service = InvitationEmailService()
