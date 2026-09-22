DISALLOWED_COMPANY_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
    "icloud.com", "aol.com", "zoho.com", "mail.com", "yandex.com", "protonmail.com"
]

def validate_business_email_domain(email: str) -> str:
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if domain in DISALLOWED_COMPANY_DOMAINS:
        raise ValueError(
            f"Recruiters must register using an official company/business email address. "
            f"Public email domains like @{domain} are not allowed."
        )
    return email
