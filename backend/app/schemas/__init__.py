from app.schemas.auth import CandidateRegister, CompanyRegister, OTPVerify, ResendOTP, UserLogin, GoogleOAuthLogin
from app.schemas.candidate import CandidateProfileUpdate
from app.schemas.company import CompanyProfileUpdate, TeamMemberCreate, TeamMemberUpdate, StaffDocumentStatusUpdate, MemberProfileUpdate
from app.schemas.job import JobCreate, JobStatusUpdate
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate
from app.schemas.support import SupportTicketCreate
from app.schemas.interview import InterviewCreate, InterviewUpdate
from app.schemas.message import InternalMessageCreate, InternalMessageOut

__all__ = [
    "CandidateRegister",
    "CompanyRegister",
    "OTPVerify",
    "ResendOTP",
    "UserLogin",
    "GoogleOAuthLogin",
    "CandidateProfileUpdate",
    "CompanyProfileUpdate",
    "MemberProfileUpdate",
    "TeamMemberCreate",
    "TeamMemberUpdate",
    "StaffDocumentStatusUpdate",
    "JobCreate",
    "JobStatusUpdate",
    "ApplicationCreate",
    "ApplicationStatusUpdate",
    "SupportTicketCreate",
    "InterviewCreate",
    "InterviewUpdate",
    "InternalMessageCreate",
    "InternalMessageOut"
]
