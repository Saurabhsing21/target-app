from __future__ import annotations

import anyio
import smtplib
from email.message import EmailMessage
import resend
from resend.exceptions import ResendError

from app.core.config import get_settings

settings = get_settings()


class EmailDeliveryError(Exception):
    pass


def is_smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_port and settings.smtp_user and settings.smtp_pass and settings.mail_from)


def is_resend_configured() -> bool:
    return bool(settings.resend_api_key and settings.mail_from and settings.frontend_url)


async def send_password_reset_email(*, to_email: str, reset_token: str) -> None:
    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={reset_token}"

    if is_smtp_configured():
        def send_smtp_sync() -> None:
            message = EmailMessage()
            message["Subject"] = "Reset your Northstar password"
            message["From"] = settings.mail_from
            message["To"] = to_email
            message.set_content(
                "We received a request to reset your Northstar password.\n\n"
                f"Reset password: {reset_url}\n\n"
                "This link expires in 1 hour."
            )
            message.add_alternative(
                (
                    "<div style='font-family:Inter,Arial,sans-serif;line-height:1.6;color:#182419'>"
                    "<h2 style='margin-bottom:12px'>Reset your password</h2>"
                    "<p>We received a request to reset your Northstar account password.</p>"
                    f"<p><a href='{reset_url}' "
                    "style='display:inline-block;padding:12px 18px;border-radius:999px;"
                    "background:#c4ee55;color:#182419;text-decoration:none;font-weight:600'>"
                    "Reset password</a></p>"
                    f"<p>If the button does not work, use this link:<br/><a href='{reset_url}'>{reset_url}</a></p>"
                    "<p>This link expires in 1 hour.</p>"
                    "</div>"
                ),
                subtype="html",
            )

            try:
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                    server.starttls()
                    server.login(settings.smtp_user, settings.smtp_pass)
                    server.send_message(message)
            except Exception as exc:
                raise EmailDeliveryError(f"SMTP email could not be sent: {exc}") from exc

        await anyio.to_thread.run_sync(send_smtp_sync)
        return

    if not is_resend_configured():
        raise RuntimeError("No email provider is fully configured")

    def send_sync() -> None:
        resend.api_key = settings.resend_api_key
        try:
            resend.Emails.send(
                {
                    "from": settings.mail_from,
                    "to": [to_email],
                    "subject": "Reset your Northstar password",
                    "html": (
                        "<div style='font-family:Inter,Arial,sans-serif;line-height:1.6;color:#182419'>"
                        "<h2 style='margin-bottom:12px'>Reset your password</h2>"
                        "<p>We received a request to reset your Northstar account password.</p>"
                        f"<p><a href='{reset_url}' "
                        "style='display:inline-block;padding:12px 18px;border-radius:999px;"
                        "background:#c4ee55;color:#182419;text-decoration:none;font-weight:600'>"
                        "Reset password</a></p>"
                        f"<p>If the button does not work, use this link:<br/><a href='{reset_url}'>{reset_url}</a></p>"
                        "<p>This link expires in 1 hour.</p>"
                        "</div>"
                    ),
                }
            )
        except ResendError as exc:
            message = str(exc)
            if "verify a domain" in message or "testing emails" in message:
                raise EmailDeliveryError(
                    "Resend sandbox sender can only deliver to the account owner's email. Verify a domain in Resend and set MAIL_FROM to that verified domain."
                ) from exc
            raise EmailDeliveryError(f"Password reset email could not be sent: {message}") from exc

    await anyio.to_thread.run_sync(send_sync)
