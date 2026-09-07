"""Password reset and temporary password generation service with SMTP email delivery."""

import logging
import secrets
import smtplib
import string
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from html import escape

from app.config import settings

logger = logging.getLogger(__name__)


def generate_temporary_password(length: int = 10) -> str:
    """Generate a secure, randomized temporary password containing letters, digits, and a symbol."""
    if length < 8:
        length = 8

    uppercase = secrets.choice(string.ascii_uppercase)
    lowercase = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)
    symbol = secrets.choice("@#$%&*!")

    remaining_chars = string.ascii_letters + string.digits
    others = [secrets.choice(remaining_chars) for _ in range(length - 4)]

    password_chars = [uppercase, lowercase, digit, symbol] + others
    # Shuffle cryptographically using secrets.SystemRandom()
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)


class PasswordResetEmailService:
    """Delivers transactional password reset emails via SMTP / Gmail."""

    @property
    def configured(self) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)

    def send_new_password(
        self,
        *,
        email: str,
        full_name: str,
        new_password: str,
    ) -> bool:
        """Send the system-generated new password to the user's email address."""
        login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"

        if not self.configured:
            logger.info(
                "[DEV MODE] SMTP not configured. Temporary password generated for %s (%s): %s",
                email,
                full_name,
                new_password,
            )
            return True

        message_id = make_msgid(domain=settings.SMTP_FROM_EMAIL.split("@")[-1])
        subject = "Mật khẩu mới cho tài khoản AI Job Portal"

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
        message["To"] = email
        message["Message-ID"] = message_id

        text_content = (
            f"Xin chào {full_name},\n\n"
            f"Hệ thống AI Job Portal đã tạo một mật khẩu mới cho tài khoản {email} theo yêu cầu của bạn:\n\n"
            f"MẬT KHẨU MỚI: {new_password}\n\n"
            f"Vui lòng truy cập {login_url} để đăng nhập bằng mật khẩu trên.\n"
            "Để bảo vệ tài khoản, xin vui lòng đổi lại mật khẩu cá nhân ngay tại mục Cài đặt tài khoản sau khi đăng nhập.\n\n"
            "Trân trọng,\n"
            f"Đội ngũ {settings.APP_NAME}"
        )
        message.set_content(text_content)

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .logo {{ color: #059669; font-size: 22px; font-weight: 800; margin-bottom: 20px; }}
    .title {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .pass-box {{ background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
    .pass-text {{ font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: 2px; }}
    .btn {{ display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 14px; margin: 16px 0; }}
    .footer {{ font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; pt: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AI Job Portal</div>
    <div class="title">Cấp mật khẩu mới theo yêu cầu</div>
    <p>Xin chào <strong>{escape(full_name)}</strong>,</p>
    <p>Hệ thống vừa nhận được yêu cầu cấp lại mật khẩu cho tài khoản <strong>{escape(email)}</strong>. Dưới đây là mật khẩu mới do hệ thống tạo riêng cho bạn:</p>

    <div class="pass-box">
      <div style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Mật khẩu mới của bạn</div>
      <div class="pass-text">{escape(new_password)}</div>
    </div>

    <p style="text-align: center;">
      <a href="{escape(login_url)}" class="btn">Đăng nhập vào hệ thống</a>
    </p>

    <p style="font-size: 13px; color: #475569;">
      <strong>Khuyến nghị an toàn:</strong> Vui lòng sử dụng mật khẩu này để đăng nhập và đổi lại mật khẩu mới trong mục <em>Cài đặt tài khoản</em> để đảm bảo an toàn tuyệt đối.
    </p>

    <div class="footer">
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
    </div>
  </div>
</body>
</html>"""
        message.add_alternative(html_content, subtype="html")

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
                if email in rejected:
                    raise smtplib.SMTPRecipientsRefused(rejected)
            logger.info("Successfully sent password reset email to %s", email)
            return True
        except (OSError, smtplib.SMTPException) as exc:
            logger.exception("Failed to send password reset email to %s: %s", email, exc)
            return False


password_reset_service = PasswordResetEmailService()
