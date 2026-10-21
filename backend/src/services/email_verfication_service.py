from html import escape
from urllib.parse import urlencode

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType 
from ..core.config import (EMAIL_PROVIDER, MAILTRAP_USERNAME, MAILTRAP_PASSWORD, MAILTRAP_HOST, MAILTRAP_PORT, FRONTEND_URL, GMAIL_USERNAME, GMAIL_PASSWORD)


class EmailVerificationService:

    if EMAIL_PROVIDER == "mailtrap":
        conf = ConnectionConfig(
            MAIL_USERNAME=MAILTRAP_USERNAME,
            MAIL_PASSWORD=MAILTRAP_PASSWORD,
            MAIL_FROM=MAILTRAP_USERNAME,
            MAIL_PORT=int(MAILTRAP_PORT),
            MAIL_SERVER=MAILTRAP_HOST,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
    else:
        conf = ConnectionConfig(
            MAIL_USERNAME=GMAIL_USERNAME,
            MAIL_PASSWORD=GMAIL_PASSWORD,
            MAIL_FROM=GMAIL_USERNAME,
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )

    @staticmethod
    def _build_otp_digits(otp: str) -> str:
        """Build individual styled digit boxes for the OTP code."""
        digits = ""
        for char in otp:
            digits += (
                f'<span style="display: inline-block; width: 48px; height: 56px; '
                f'line-height: 56px; text-align: center; font-size: 28px; font-weight: bold; '
                f'color: #1e40af; background: #eff6ff; border: 2px solid #bfdbfe; '
                f'border-radius: 10px; margin: 0 4px;">{char}</span>'
            )
        return digits

    @staticmethod
    async def send_email_verfication(otp: str, verification_token: str, recipient_email: str, recipient_name: str):
        MAGIC_LINK = f"{FRONTEND_URL}/verify-email?{urlencode({'token': verification_token})}"
        safe_name = escape(recipient_name)
        safe_magic_link = escape(MAGIC_LINK, quote=True)
        otp_digits = __class__._build_otp_digits(otp)

        message = MessageSchema(
            subject="✉️ Verify Your Email — Thumbnail Builder",
            recipients=[recipient_email],
            body=f"""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                        background: #ffffff; border-radius: 12px; overflow: hidden;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
                        Thumbnail Builder
                    </h1>
                    <p style="margin: 6px 0 0; color: #bfdbfe; font-size: 14px;">Email Verification</p>
                </div>

                <!-- Body -->
                <div style="padding: 32px 28px;">
                    <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">
                        Hey {safe_name} 👋
                    </h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                        Thanks for signing up! Please verify your email address using one of the options below.
                    </p>

                    <!-- OTP Section -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
                                padding: 24px; margin: 0 0 24px; text-align: center;">
                        <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; text-transform: uppercase;
                                  letter-spacing: 1px; font-weight: 600;">
                            Option 1 — Your verification code
                        </p>
                        <div style="margin: 16px 0;">
                            {otp_digits}
                        </div>
                        <p style="margin: 12px 0 0; color: #94a3b8; font-size: 13px;">
                            ⏱ This code expires in <strong>5 minute</strong>
                        </p>
                    </div>

                    <!-- Divider -->
                    <div style="text-align: center; margin: 24px 0; position: relative;">
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;" />
                        <span style="background: #ffffff; padding: 0 16px; color: #94a3b8; font-size: 13px;
                                     position: relative; top: -10px;">
                            OR
                        </span>
                    </div>

                    <!-- Button Section -->
                    <div style="text-align: center; margin: 0 0 24px;">
                        <p style="margin: 0 0 16px; color: #475569; font-size: 14px;">
                            <strong>Option 2</strong> — Click the button to verify instantly
                        </p>
                        <a href="{safe_magic_link}"
                           style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6);
                                  color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px;
                                  font-weight: 600; font-size: 15px; letter-spacing: 0.3px;
                                  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                            ✓&nbsp; Verify My Email
                        </a>
                    </div>

                    <!-- Link fallback -->
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; word-break: break-all;">
                        If the button doesn't work, copy and paste this link into your browser:<br/>
                        <a href="{safe_magic_link}" style="color: #3b82f6;">{safe_magic_link}</a>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                        If you didn't create an account, you can safely ignore this email.<br/>
                        © Thumbnail Builderis_verified
                    </p>
                </div>
            </div>
            """,
            subtype=MessageType.html
        )

        fm = FastMail(__class__.conf)
        return await fm.send_message(message)
        


    @staticmethod
    async def reset_password_email(reset_token: str, recipient_email: str, recipient_name: str):
        reset_link = f"{FRONTEND_URL}/reset-password?{urlencode({'token': reset_token})}"
        safe_name = escape(recipient_name)
        safe_reset_link = escape(reset_link, quote=True)

        message = MessageSchema(
          subject="Reset Your Thumbnail Builder Password",
          recipients=[recipient_email],
          body=f"""
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: #ffffff; border-radius: 12px; overflow: hidden;
                box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Thumbnail Builder
            </h1>
            <p style="margin: 6px 0 0; color: #bfdbfe; font-size: 14px;">Password Reset</p>
        </div>

        <div style="padding: 32px 28px;">
            <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">
                Hello {safe_name},
            </h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset your password. Use the button below to choose a new password.
                This link expires in <strong>5 minutes</strong>.
            </p>

            <div style="text-align: center; margin: 0 0 24px;">
                <a href="{safe_reset_link}"
                   style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6);
                          color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px;
                          font-weight: 600; font-size: 15px;">
                    Reset My Password
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="{safe_reset_link}" style="color: #3b82f6;">{safe_reset_link}</a>
            </p>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                If you didn't request a password reset, you can safely ignore this email.<br/>
                © Thumbnail Builder
            </p>
        </div>
          </div>
          """,
          subtype=MessageType.html,
        )

        fm = FastMail(__class__.conf)
        return await fm.send_message(message)


#* -----------------------

# Library (fastapi-email like Nodemailer) is code inside your app. It formats the email 
# and connects to an SMTP server to hand it over.

#* ----------------------

# SMTP server is the email provider's service that accepts the message and delivers 
# or relays it to the recipient's email provider.