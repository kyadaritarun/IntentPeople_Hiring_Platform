from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from app.core.validators import validate_business_email_domain

class CandidateRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    place: Optional[str] = ""
    city: str
    state: str
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class CompanyRegister(BaseModel):
    full_name: str
    company_name: str
    email: EmailStr
    phone: str
    website: str
    location: str
    company_size: str
    password: str
    confirm_password: str
    company_details: Optional[str] = ""
    industry: Optional[str] = "Digital Marketing"

    @field_validator("full_name", "company_name", "phone", "website", "location", "company_size")
    @classmethod
    def check_non_empty(cls, v: str):
        if not v or not v.strip():
            raise ValueError("This field is required")
        return v.strip()

    @field_validator("email")
    @classmethod
    def check_business_email(cls, email: str):
        return validate_business_email_domain(email)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class ResendOTP(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleOAuthLogin(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Optional[str] = "CANDIDATE"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

