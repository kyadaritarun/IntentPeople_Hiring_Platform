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
    sender_name = settings.SMTP_FROM_NAME or "IntentPeople Hiring Platform"

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

    subject = f"{otp_code} is your IntentPeople verification code"

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
    <div class="brand">INTENTPEOPLE <span>HIRING</span></div>
    <div class="greeting">Email Verification Code</div>
    <p class="info">
      Hello{f' {user_name}' if user_name else ''},<br>
      Please enter the following 6-digit verification code in the IntentPeople Hiring Portal to complete your registration:
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

    plain_content = f"Your IntentPeople verification code is: {otp_code}\n\nThis code expires in 15 minutes.\nIf you did not request this, please disregard this email."

    return _dispatch_smtp(to_email, subject, plain_content, html_content)


def send_password_reset_email(to_email: str, otp_code: str, user_name: str = "") -> bool:
    """
    Sends a Password Reset OTP email to the user.
    """
    sender_email = settings.SMTP_USER or settings.SMTP_FROM_EMAIL
    sender_password = settings.SMTP_PASSWORD
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    sender_name = settings.SMTP_FROM_NAME or "IntentPeople Hiring Platform"

    if not sender_email or not sender_password:
        logger.warning(
            f"\n"
            f"========================================================\n"
            f"  [PASSWORD RESET EMAIL NOTICE - SMTP NOT CONFIGURED]\n"
            f"  Target Recipient: {to_email}\n"
            f"  Reset OTP Code: {otp_code}\n"
            f"========================================================\n"
        )
        return False

    subject = f"{otp_code} is your IntentPeople password reset code"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .brand {{ font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; }}
    .brand span {{ color: #FF6008; }}
    .greeting {{ font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }}
    .info {{ font-size: 13.5px; color: #475569; line-height: 1.55; margin-bottom: 24px; }}
    .otp-container {{ background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px dashed #fed7aa; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
    .otp-label {{ font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }}
    .otp-value {{ font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #9a3412; font-family: 'Courier New', monospace; }}
    .validity {{ font-size: 11.5px; color: #64748b; margin-top: 6px; }}
    .note {{ font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">INTENTPEOPLE <span>HIRING</span></div>
    <div class="greeting">Reset Your Password</div>
    <p class="info">
      Hello{f' {user_name}' if user_name else ''},<br>
      We received a request to reset the password for your IntentPeople account. Please enter the following 6-digit code to choose a new password:
    </p>
    <div class="otp-container">
      <div class="otp-label">Password Reset Code</div>
      <div class="otp-value">{otp_code}</div>
      <div class="validity">Expires in 15 minutes • Do not share this code with anyone</div>
    </div>
    <div class="note">
      If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized activity on your account.
    </div>
  </div>
</body>
</html>"""

    plain_content = f"Your IntentPeople password reset code is: {otp_code}\n\nThis code expires in 15 minutes.\nIf you did not request this, please disregard this email."

    return _dispatch_smtp(to_email, subject, plain_content, html_content)



def _dispatch_smtp(to_email: str, subject: str, plain_content: str, html_content: str) -> bool:
    sender_email = settings.SMTP_USER or settings.SMTP_FROM_EMAIL
    sender_password = settings.SMTP_PASSWORD
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    sender_name = settings.SMTP_FROM_NAME or "IntentPeople Hiring Platform"

    if not sender_email or not sender_password:
        return False

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
        logger.info(f"Email successfully delivered to {to_email} with subject: {subject}")
        return True
    except Exception as err:
        logger.error(f"SMTP Delivery failed to {to_email}: {err}")
        return False


def send_vendor_invitation_email(
    to_email: str,
    vendor_name: str,
    company_name: str,
    subdomain: str,
    price: int,
    currency: str,
    validity_days: int,
    billing_note: str,
    quotas: dict,
    sidebar_modules: dict,
    payment_url: str
) -> bool:
    """
    Sends a tailored vendor onboarding invitation email with custom price, validity, quotas,
    subdomain address, and the secure payment activation link.
    """
    price_display = f"₹{price:,}" if currency == "INR" else f"{currency} {price:,}"
    max_roles = quotas.get("max_roles", 2)
    max_jobs = quotas.get("max_jobs", 5)
    max_cands = quotas.get("max_candidates_per_job", 100)

    # Always log prominent notice to console for easy developer testing and reference
    logger.info(
        f"\n"
        f"======================================================================\n"
        f"  [VENDOR INVITATION DISPATCH NOTICE]\n"
        f"  Recipient Email: {to_email}\n"
        f"  Vendor Name: {vendor_name} ({company_name})\n"
        f"  Dedicated Subdomain: https://{subdomain}.intentpeople.com\n"
        f"  Price: {price_display} | Validity: {validity_days} Days\n"
        f"  Quotas: {max_jobs} Jobs, {max_roles} Staff Seats, {max_cands} Candidates/Job\n"
        f"  Payment Link: {payment_url}\n"
        f"======================================================================\n"
    )

    subject = f"Invitation: Activate Your Dedicated Hiring Portal for {company_name} ({subdomain}.intentpeople.com)"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 28px 14px; color: #1e293b; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }}
    .header {{ border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    .brand {{ font-size: 22px; font-weight: 800; color: #1e3155; text-transform: uppercase; letter-spacing: -0.5px; }}
    .brand span {{ color: #5c59e8; }}
    .badge {{ display: inline-block; background: #ede9fe; color: #6d28d9; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }}
    .title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; line-height: 1.3; }}
    .subtitle {{ font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }}
    .box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px; }}
    .box-title {{ font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }}
    .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
    .meta-item {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }}
    .meta-label {{ font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }}
    .meta-val {{ font-size: 15px; font-weight: 700; color: #0f172a; }}
    .highlight-subdomain {{ background: linear-gradient(135deg, #1e3155 0%, #2a4365 100%); color: #ffffff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }}
    .highlight-subdomain .sub-title {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }}
    .highlight-subdomain .sub-url {{ font-size: 18px; font-weight: 800; color: #38bdf8; font-family: monospace; margin-top: 4px; }}
    .btn {{ display: block; width: 100%; text-align: center; background: #5c59e8; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 14px rgba(92, 89, 232, 0.4); margin: 26px 0 16px 0; }}
    .fallback {{ font-size: 11.5px; color: #94a3b8; word-break: break-all; line-height: 1.5; text-align: center; }}
    .footer {{ border-top: 1px solid #f1f5f9; margin-top: 28px; padding-top: 18px; font-size: 12px; color: #94a3b8; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">INTENTPEOPLE <span>HIRING PORTAL</span></div>
      <div class="badge">Official Partner Onboarding</div>
    </div>

    <div class="title">Exclusive Invitation for {company_name}</div>
    <div class="subtitle">
      Hello{f' {vendor_name}' if vendor_name else ''},<br>
      The Super Administrator of IntentPeople has created a dedicated recruitment portal package tailored specifically for <strong>{company_name}</strong>.
    </div>

    <div class="highlight-subdomain">
      <div class="sub-title">Your Reserved Portal Address</div>
      <div class="sub-url">https://{subdomain}.intentpeople.com</div>
    </div>

    <div class="box">
      <div class="box-title">Tailored Package Commercials & Quotas</div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Onboarding Price</div>
          <div class="meta-val" style="color: #059669;">{price_display}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Access Validity</div>
          <div class="meta-val">{validity_days} Days</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Active Job Postings</div>
          <div class="meta-val">{max_jobs} Jobs</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Staff / Recruiter Seats</div>
          <div class="meta-val">{max_roles} Roles</div>
        </div>
        <div class="meta-item" style="grid-column: span 2;">
          <div class="meta-label">Candidate Limit Per Job</div>
          <div class="meta-val">{max_cands} Visible Applicants / Job</div>
        </div>
      </div>
    </div>

    <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
      Once payment is completed, your custom portal credentials and dedicated tenant environment will be instantly provisioned and delivered to your inbox.
    </p>

    <a href="{payment_url}" class="btn">Complete Payment & Activate Portal →</a>

    <div class="fallback">
      Or copy & paste this direct checkout URL into your browser:<br>
      <a href="{payment_url}" style="color: #5c59e8;">{payment_url}</a>
    </div>

    <div class="footer">
      © 2026 IntentPeople Hiring Platform. All rights reserved. If you have questions, reply directly to this invitation.
    </div>
  </div>
</body>
</html>"""

    plain_content = (
        f"Exclusive Invitation for {company_name}\n\n"
        f"Hello {vendor_name},\n"
        f"You have been invited to activate your dedicated hiring portal on IntentPeople.\n\n"
        f"Reserved Portal: https://{subdomain}.intentpeople.com\n"
        f"Price: {price_display} ({validity_days} Days)\n"
        f"Quotas: {max_jobs} Jobs | {max_roles} Staff Seats | {max_cands} Candidates per job\n\n"
        f"To complete your payment and activate your portal, please visit:\n"
        f"{payment_url}\n"
    )

    return _dispatch_smtp(to_email, subject, plain_content, html_content)


def send_vendor_credentials_email(
    to_email: str,
    vendor_name: str,
    company_name: str,
    subdomain: str,
    login_email: str,
    temporary_password: str,
    portal_url: str,
    quotas: dict,
    validity_days: int
) -> bool:
    """
    Sends the vendor their activated portal credentials (User ID, password) and dedicated subdomain URL.
    """
    # Always log prominent notice to console for easy developer testing and reference
    logger.info(
        f"\n"
        f"======================================================================\n"
        f"  [VENDOR CREDENTIALS DISPATCH NOTICE]\n"
        f"  Target Recipient: {to_email}\n"
        f"  Company Name: {company_name}\n"
        f"  Dedicated Portal URL: {portal_url}\n"
        f"  Subdomain: https://{subdomain}.intentpeople.com\n"
        f"  User ID / Email: {login_email}\n"
        f"  Generated Password: {temporary_password}\n"
        f"======================================================================\n"
    )

    subject = f"Your Dedicated Hiring Portal is Active! Credentials & Login for {company_name}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 28px 14px; color: #1e293b; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }}
    .header {{ border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    .brand {{ font-size: 22px; font-weight: 800; color: #1e3155; text-transform: uppercase; letter-spacing: -0.5px; }}
    .brand span {{ color: #059669; }}
    .badge {{ display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }}
    .title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; line-height: 1.3; }}
    .subtitle {{ font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }}
    .cred-box {{ background: linear-gradient(135deg, #1e3155 0%, #0f172a 100%); border-radius: 14px; padding: 24px; margin-bottom: 24px; color: #ffffff; }}
    .cred-title {{ font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }}
    .cred-row {{ margin-bottom: 12px; }}
    .cred-row:last-child {{ margin-bottom: 0; }}
    .cred-label {{ font-size: 11px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; margin-bottom: 4px; }}
    .cred-val {{ font-size: 16px; font-weight: 700; font-family: monospace; color: #38bdf8; background: rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 8px; display: inline-block; word-break: break-all; }}
    .btn {{ display: block; width: 100%; text-align: center; background: #059669; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); margin: 26px 0 16px 0; }}
    .footer {{ border-top: 1px solid #f1f5f9; margin-top: 28px; padding-top: 18px; font-size: 12px; color: #94a3b8; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">INTENTPEOPLE <span>HIRING PORTAL</span></div>
      <div class="badge">Payment Confirmed • Portal Activated</div>
    </div>

    <div class="title">Welcome, {company_name}!</div>
    <div class="subtitle">
      Hello{f' {vendor_name}' if vendor_name else ''},<br>
      Your payment has been successfully recorded and your custom organization hiring portal is now live and fully operational for the next <strong>{validity_days} days</strong>.
    </div>

    <div class="cred-box">
      <div class="cred-title">Your Portal Login Credentials</div>
      <div class="cred-row">
        <div class="cred-label">Portal Address</div>
        <div class="cred-val" style="color: #67e8f9;">https://{subdomain}.intentpeople.com</div>
      </div>
      <div class="cred-row">
        <div class="cred-label">User ID / Email</div>
        <div class="cred-val" style="color: #ffffff;">{login_email}</div>
      </div>
      <div class="cred-row">
        <div class="cred-label">Generated Password</div>
        <div class="cred-val" style="color: #fef08a;">{temporary_password}</div>
      </div>
    </div>

    <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
      You can now log in to post jobs, invite recruiters and hiring managers, manage candidate pipelines, and utilize all features configured for your organization by the Super Administrator.
    </p>

    <a href="{portal_url}" class="btn">Log In to Your Dedicated Portal →</a>

    <div class="footer">
      © 2026 IntentPeople Hiring Platform. All rights reserved. Please keep your credentials secure.
    </div>
  </div>
</body>
</html>"""

    plain_content = (
        f"Your Dedicated Hiring Portal is Active!\n\n"
        f"Hello {vendor_name},\n"
        f"Your organization portal for {company_name} is now live.\n\n"
        f"Dedicated Portal: https://{subdomain}.intentpeople.com\n"
        f"User ID / Email: {login_email}\n"
        f"Password: {temporary_password}\n"
        f"Direct Login Link: {portal_url}\n\n"
        f"Access Validity: {validity_days} Days\n"
    )

    return _dispatch_smtp(to_email, subject, plain_content, html_content)

