import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger("uvicorn.error")

def send_otp_email(to_email: str, otp_code: str, user_name: str = "") -> bool:
    """
    Sends an OTP verification email using SMTP credentials configured in .env / settings.
    If SMTP credentials are not yet configured, logs the OTP clearly for developer reference.
    """
    sender_email = settings.SMTP_USER or settings.SMTP_FROM_EMAIL
    sender_password = settings.SMTP_PASSWORD
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    sender_name = settings.SMTP_FROM_NAME or "Uptrix Hiring Platform"

    if not sender_email or not sender_password:
        logger.warning(
            f"\n"
            f"========================================================\n"
            f"  [EMAIL DISPATCH NOTICE - SMTP NOT FULLY CONFIGURED]\n"
            f"  Target Recipient: {to_email}\n"
            f"  Verification OTP Code: {otp_code}\n"
            f"  To send real emails to inboxes, please set:\n"
            f"    SMTP_USER=your_email@gmail.com\n"
            f"    SMTP_PASSWORD=your_gmail_app_password\n"
            f"  in backend/.env\n"
            f"========================================================\n"
        )
        return False

    subject = f"{otp_code} is your Uptrix verification code"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .brand {{ font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; }}
    .brand span {{ color: #5a8270; }}
    .greeting {{ font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }}
    .info {{ font-size: 13.5px; color: #475569; line-height: 1.55; margin-bottom: 24px; }}
    .otp-container {{ background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #6ee7b7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
    .otp-label {{ font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }}
    .otp-value {{ font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064e3b; font-family: 'Courier New', monospace; }}
    .validity {{ font-size: 11.5px; color: #64748b; margin-top: 6px; }}
    .note {{ font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">UPTRIX <span>HIRING</span></div>
    <div class="greeting">Email Verification Code</div>
    <p class="info">
      Hello{f' {user_name}' if user_name else ''},<br>
      Please enter the following 6-digit verification code in the Uptrix Hiring Portal to complete your registration:
    </p>
    <div class="otp-container">
      <div class="otp-label">Your One-Time Password</div>
      <div class="otp-value">{otp_code}</div>
      <div class="validity">Expires in 15 minutes • Do not share this code</div>
    </div>
    <div class="note">
      If you did not request this verification code, you can safely disregard this email.
    </div>
  </div>
</body>
</html>"""

    plain_content = f"Your Uptrix verification code is: {otp_code}\n\nThis code expires in 15 minutes.\nIf you did not request this, please disregard this email."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            if settings.SMTP_TLS:
                server.starttls()
        
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Verification OTP email successfully delivered to {to_email}")
        return True
    except Exception as err:
        logger.error(f"SMTP Delivery failed to {to_email}: {err}")
        return False
