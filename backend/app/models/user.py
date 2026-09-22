from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "portal_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'CANDIDATE' or 'RECRUITER'
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)
    company_profile = relationship("Company", back_populates="user", uselist=False)
    company_member_profile = relationship("CompanyMember", back_populates="user", uselist=False)
    otps = relationship("OTPVerification", back_populates="user")
    support_tickets = relationship("SupportTicket", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class OTPVerification(Base):
    __tablename__ = "portal_otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    email = Column(String, nullable=False)
    otp_code = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Boolean, default=False)

    user = relationship("User", back_populates="otps")
