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

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class CompanyRegister(BaseModel):
    company_name: str
    email: EmailStr
    phone: str
    website: str
    company_details: str
    password: str
    confirm_password: str
    industry: Optional[str] = "Digital Marketing"
    location: Optional[str] = None

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
