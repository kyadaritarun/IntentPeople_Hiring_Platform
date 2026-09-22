from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Company(Base):
    __tablename__ = "portal_companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    company_name = Column(String, nullable=False)
    business_email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True, default="Digital Marketing")
    location = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    product_service = Column(Text, nullable=True)
    business_model = Column(String, nullable=True)  # B2B SaaS, D2C, Marketplace, Agency, Local Services
    growth_stage = Column(String, nullable=True)    # Bootstrapped, Seed Stage, Early Stage, Series A/B, Growth / Scale-Up, Mature Enterprise
    target_audience = Column(Text, nullable=True)
    ideal_customer_profile = Column(Text, nullable=True)
    business_problem = Column(Text, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    team_support = Column(Text, nullable=True)
    monthly_budget_range = Column(String, nullable=True)
    decision_authority = Column(String, nullable=True)
    success_horizon = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="PENDING")  # PENDING, VERIFIED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="company_profile")
    jobs = relationship("Job", back_populates="company")
    members = relationship("CompanyMember", back_populates="company", cascade="all, delete-orphan")
    staff_documents = relationship("StaffDocument", back_populates="company", cascade="all, delete-orphan")

class CompanyMember(Base):
    __tablename__ = "portal_company_members"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False)  # 'RECRUITER' or 'HIRING_MANAGER'
    title = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    place = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="members")
    user = relationship("User", back_populates="company_member_profile")
    documents = relationship("StaffDocument", back_populates="member", cascade="all, delete-orphan")

class StaffDocument(Base):
    __tablename__ = "portal_staff_documents"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("portal_company_members.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String, nullable=False)  # NATIONAL_ID, PASSPORT, PAN_CARD, AADHAAR, CONTRACT, ADDRESS_PROOF, CERTIFICATE, OTHER
    doc_name = Column(String, nullable=False)
    doc_number = Column(String, nullable=True)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    status = Column(String, default="VERIFIED")  # VERIFIED, PENDING, REJECTED
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="staff_documents")
    member = relationship("CompanyMember", back_populates="documents")

