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
    payment_url: str,
    is_renewal: bool = False
) -> bool:
    """
    Sends a tailored vendor onboarding or renewal invitation email with custom price, validity, quotas,
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
        f"  [VENDOR INVITATION DISPATCH NOTICE - {'RENEWAL' if is_renewal else 'NEW ONBOARDING'}]\n"
        f"  Recipient Email: {to_email}\n"
        f"  Vendor Name: {vendor_name} ({company_name})\n"
        f"  Dedicated Subdomain: https://{subdomain}.intentpeople.com\n"
        f"  Price: {price_display} | Validity: +{validity_days} Days\n"
        f"  Quotas: {max_jobs} Jobs, {max_roles} Staff Seats, {max_cands} Candidates/Job\n"
        f"  Payment Link: {payment_url}\n"
        f"======================================================================\n"
    )

    if is_renewal:
        subject = f"Plan Renewal & Quota Upgrade for {company_name} ({subdomain}.intentpeople.com)"
        headline = f"Your Plan Renewal &amp; Quota Upgrade for <strong>{company_name}</strong>"
        intro_text = f"We have prepared your dedicated portal renewal and quota upgrade invoice for <strong>{company_name}</strong> on IntentPeople."
        validity_label = f"Validity Extension: +{validity_days} Days"
        completion_text = "Once payment is completed via Razorpay (UPI, Credit/Debit Card, Netbanking), your portal validity will be instantly extended and all upgraded quotas will be activated."
        credentials_note = f"You can continue logging in to your portal using your existing account password at <a href=\"https://{subdomain}.intentpeople.com\" target=\"_blank\" style=\"color: #2563eb; text-decoration: underline;\">https://{subdomain}.intentpeople.com</a>."
        cta_button_text = "Complete Payment &amp; Extend Validity"
    else:
        subject = f"Invitation: Activate Your Dedicated Hiring Portal for {company_name} ({subdomain}.intentpeople.com)"
        headline = f"Dedicated Recruitment Portal for <strong>{company_name}</strong>"
        intro_text = f"We’re pleased to let you know that your dedicated recruitment portal for <strong>{company_name}</strong> has been successfully provisioned on IntentPeople."
        validity_label = f"Access Validity: {validity_days} Days"
        completion_text = "Once your payment is completed, your portal access will be activated and your Master Admin account will be ready to use."
        credentials_note = "Your login credentials and access details will be provided after successful activation."
        cta_button_text = "Complete Payment &amp; Activate Your Portal"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.65; background-color: #ffffff; margin: 0; padding: 16px 20px;">
  <div style="max-width: 650px; margin: 0; padding: 0;">
    <p style="margin: 0 0 16px 0;">Hello {vendor_name or company_name},</p>

    <p style="margin: 0 0 16px 0;">{intro_text}</p>

    <p style="margin: 0 0 16px 0;">Your portal gives your team a dedicated, secure environment to manage job openings, recruiters, candidates, and hiring activities from one place.</p>

    <p style="margin: 0 0 4px 0;"><strong>Your Dedicated Portal Address</strong></p>
    <p style="margin: 0 0 4px 0;"><a href="https://{subdomain}.intentpeople.com" target="_blank" style="color: #2563eb; text-decoration: underline;">https://{subdomain}.intentpeople.com</a></p>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13.5px;">Secured with SSL and configured as a dedicated environment for your organization.</p>

    <p style="margin: 0 0 6px 0;"><strong>Plan &amp; Quota Details</strong></p>
    <p style="margin: 0 0 20px 0; line-height: 1.75;">
      Price: {price_display}<br/>
      {validity_label}<br/>
      Active Job Postings: Up to {max_jobs}<br/>
      Recruiter / Staff Seats: Up to {max_roles}<br/>
      Candidate Pipeline: Up to {max_cands} visible applicants per job
    </p>

    <p style="margin: 0 0 14px 0;">{completion_text}</p>

    <p style="margin: 0 0 20px 0;">{credentials_note}</p>

    <p style="margin: 0 0 6px 0;"><strong>{cta_button_text}:</strong></p>
    <p style="margin: 0 0 20px 0;">
      <a href="{payment_url}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all;">{payment_url}</a>
    </p>

    <p style="margin: 0 0 16px 0;">If you have any questions or need assistance with activation, simply reply to this email or contact us at <a href="mailto:support@intentpeople.com" style="color: #2563eb; text-decoration: underline;">support@intentpeople.com</a>.</p>

    <p style="margin: 0 0 24px 0;">We look forward to supporting your recruitment process.</p>

    <p style="margin: 0 0 4px 0;">Best regards,</p>
    <p style="margin: 0 0 20px 0; line-height: 1.4;">
      <strong>IntentPeople Team</strong><br/>
      <span style="color: #64748b; font-size: 13.5px;">Recruitment &amp; Staffing Platform</span>
    </p>

    <p style="margin: 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      &copy; 2026 IntentPeople Hiring Platform. All rights reserved.
    </p>
  </div>
</body>
</html>"""

    plain_content = (
        f"Hello {vendor_name or company_name},\n\n"
        f"We’re pleased to let you know that your dedicated recruitment portal for {company_name} has been successfully provisioned on IntentPeople.\n\n"
        f"Your portal is designed to give your team a secure and streamlined environment to manage job openings, recruiters, candidates, and hiring activities from one place.\n\n"
        f"Your Recruitment Portal\n"
        f"https://{subdomain}.intentpeople.com\n"
        f"Your portal is secured with SSL and configured as a dedicated environment for your organization.\n\n"
        f"Plan Details\n"
        f"Onboarding Price: {price_display}\n"
        f"Access Validity: {validity_days} Days\n"
        f"Active Job Postings: Up to {max_jobs}\n"
        f"Recruiter / Staff Seats: Up to {max_roles}\n"
        f"Candidate Pipeline: Up to {max_cands} visible applicants per job\n\n"
        f"Once your payment is completed, your portal access will be activated and your Master Admin account will be ready to use.\n\n"
        f"Your login credentials and access details will be provided after successful activation.\n\n"
        f"Complete Payment & Activate Your Portal:\n"
        f"{payment_url}\n\n"
        f"If you have any questions or need assistance with activation, simply reply to this email or contact us at support@intentpeople.com.\n\n"
        f"We look forward to supporting your recruitment process.\n\n"
        f"Best regards,\n"
        f"IntentPeople Team\n"
        f"Recruitment & Staffing Platform\n\n"
        f"© 2026 IntentPeople Hiring Platform. All rights reserved.\n"
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
    validity_days: int,
    is_renewal: bool = False
) -> bool:
    """
    Sends the vendor their activated portal credentials (User ID, password) and dedicated subdomain URL in message format.
    """
    # Always log prominent notice to console for easy developer testing and reference
    logger.info(
        f"\n"
        f"======================================================================\n"
        f"  [VENDOR CREDENTIALS DISPATCH NOTICE - {'RENEWAL CONFIRMATION' if is_renewal else 'NEW ACTIVATION'}]\n"
        f"  Target Recipient: {to_email}\n"
        f"  Company Name: {company_name}\n"
        f"  Dedicated Portal URL: {portal_url}\n"
        f"  Subdomain: https://{subdomain}.intentpeople.com\n"
        f"  User ID / Email: {login_email}\n"
        f"  Password Status: {'Existing Account Password' if is_renewal else temporary_password}\n"
        f"======================================================================\n"
    )

    if is_renewal:
        subject = f"Portal Renewal & Upgrade Confirmed! Access Details for {company_name}"
        intro_sentence = f"Your payment has been successfully confirmed and your dedicated recruitment portal for <strong>{company_name}</strong> has been successfully extended for an additional {validity_days} days with upgraded quotas."
        password_row = f"Account Password: <strong>(Use your existing account password)</strong><br/>"
        security_note = "You can sign in immediately using your existing credentials. All updated job postings and staff limits are now active."
    else:
        subject = f"Your Dedicated Hiring Portal is Active! Credentials & Login for {company_name}"
        intro_sentence = f"Your payment has been successfully confirmed and your dedicated organization recruitment portal for <strong>{company_name}</strong> is now live on IntentPeople for the next {validity_days} days."
        password_row = f"Temporary Master Password: <strong>{temporary_password}</strong><br/>"
        security_note = "Please keep these credentials secure. You can update your temporary master password anytime in your portal settings after logging in."

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.65; background-color: #ffffff; margin: 0; padding: 16px 20px;">
  <div style="max-width: 650px; margin: 0; padding: 0;">
    <p style="margin: 0 0 16px 0;">Hello {vendor_name or company_name},</p>

    <p style="margin: 0 0 16px 0;">{intro_sentence}</p>

    <p style="margin: 0 0 6px 0;"><strong>Your Portal Access Details:</strong></p>
    <p style="margin: 0 0 20px 0; line-height: 1.85;">
      Dedicated Portal Address: <a href="https://{subdomain}.intentpeople.com" target="_blank" style="color: #2563eb; text-decoration: underline;">https://{subdomain}.intentpeople.com</a><br/>
      User ID / Email: <strong>{login_email}</strong><br/>
      {password_row}
    </p>

    <p style="margin: 0 0 6px 0;"><strong>Sign In to Your Dedicated Portal:</strong></p>
    <p style="margin: 0 0 20px 0;">
      <a href="{portal_url}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all;">{portal_url}</a>
    </p>

    <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #64748b;">
      {security_note}
    </p>

    <p style="margin: 0 0 16px 0;">
      You can now begin publishing job openings, inviting recruiters and hiring managers, configuring hiring stages, and reviewing candidate pipelines.
    </p>

    <p style="margin: 0 0 16px 0;">
      If you have any questions or require assistance, simply reply directly to this email or contact us at <a href="mailto:support@intentpeople.com" style="color: #2563eb; text-decoration: underline;">support@intentpeople.com</a>.
    </p>

    <p style="margin: 0 0 24px 0;">We look forward to supporting your recruitment process.</p>

    <p style="margin: 0 0 4px 0;">Best regards,</p>
    <p style="margin: 0 0 20px 0; line-height: 1.4;">
      <strong>IntentPeople Team</strong><br/>
      <span style="color: #64748b; font-size: 13.5px;">Recruitment &amp; Staffing Platform</span>
    </p>

    <p style="margin: 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      &copy; 2026 IntentPeople Hiring Platform. All rights reserved.
    </p>
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
        f"Access Validity: {validity_days} Days\n\n"
        f"Please keep these credentials secure.\n\n"
        f"Best regards,\n"
        f"IntentPeople Team\n"
        f"Recruitment & Staffing Platform\n"
    )

    return _dispatch_smtp(to_email, subject, plain_content, html_content)

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

