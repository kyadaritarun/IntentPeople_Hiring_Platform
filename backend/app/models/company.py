from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
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
    primary_industry = Column(String, nullable=True)
    sub_industry = Column(String, nullable=True)
    organisation_type = Column(String, nullable=True)  # Private Limited, Public, Partnership, Sole Proprietorship, Non-Profit, Startup
    company_size = Column(String, nullable=True)       # 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
    contact_person = Column(String, nullable=True)
    location = Column(String, nullable=True)
    headquarters_location = Column(String, nullable=True)
    other_locations = Column(Text, nullable=True)
    linkedin_url = Column(String, nullable=True)
    year_founded = Column(String, nullable=True)
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
    business_model_data = Column(JSON, nullable=True)
    target_audience_data = Column(JSON, nullable=True)
    growth_stage_data = Column(JSON, nullable=True)
    marketing_team_data = Column(JSON, nullable=True)
    hiring_defaults_data = Column(JSON, nullable=True)
    compliance_documents_data = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="PENDING_PROFILE")  # PENDING_PROFILE, UNDER_REVIEW, VERIFIED, REJECTED
    verification_requested_at = Column(DateTime, nullable=True)
    verification_reviewed_at = Column(DateTime, nullable=True)
    verification_rejection_reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    subdomain = Column(String, unique=True, nullable=True, index=True)
    
    # Subscription & Plan details: FREE, PLAN_4999, PLAN_14999
    plan_type = Column(String, default="FREE")
    plan_status = Column(String, default="ACTIVE") # PENDING, ACTIVE, EXPIRED
    plan_activated_at = Column(DateTime, nullable=True)
    plan_expires_at = Column(DateTime, nullable=True)
    max_roles = Column(Integer, default=1)
    max_jobs = Column(Integer, default=1)
    max_candidates_per_job = Column(Integer, default=15)
    sidebar_access = Column(JSON, nullable=True)  # Custom sidebar access override
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="company_profile")
    jobs = relationship("Job", back_populates="company")
    members = relationship("CompanyMember", back_populates="company", cascade="all, delete-orphan")
    staff_documents = relationship("StaffDocument", back_populates="company", cascade="all, delete-orphan")
    staff_groups = relationship("StaffGroup", back_populates="company", cascade="all, delete-orphan")

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
    group_memberships = relationship("StaffGroupMember", back_populates="member", cascade="all, delete-orphan")

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


class StaffGroup(Base):
    __tablename__ = "portal_staff_groups"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String, nullable=True, default="General")
    created_by = Column(Integer, ForeignKey("portal_users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="staff_groups")
    members = relationship("StaffGroupMember", back_populates="group", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="group")


class StaffGroupMember(Base):
    __tablename__ = "portal_staff_group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("portal_staff_groups.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("portal_company_members.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("StaffGroup", back_populates="members")
    member = relationship("CompanyMember", back_populates="group_memberships")


class PaymentTransaction(Base):
    __tablename__ = "portal_payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("portal_users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String, nullable=False)  # 'FREE', 'PLAN_4999', 'PLAN_14999'
    amount = Column(Integer, nullable=False)  # In INR (e.g. 0, 4999, 14999)
    currency = Column(String, default="INR")
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    status = Column(String, default="SUCCESS")  # 'SUCCESS', 'FAILED', 'PENDING'
    created_at = Column(DateTime, default=datetime.utcnow)


class PlanConfig(Base):
    __tablename__ = "portal_plan_configs"

    id = Column(String, primary_key=True)  # 'FREE', 'PLAN_4999', 'PLAN_14999'
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False, default=0)
    price_display = Column(String, nullable=False, default="₹0")
    billing = Column(String, nullable=False, default="Free Trial")
    duration_days = Column(Integer, nullable=False, default=365)
    max_roles = Column(Integer, nullable=False, default=1)
    max_jobs = Column(Integer, nullable=False, default=1)
    max_candidates_per_job = Column(Integer, nullable=False, default=15)
    badge = Column(String, nullable=True, default="")
    is_popular = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    features = Column(JSON, default=list)
    sidebar_access = Column(JSON, default=dict)  # Role-based sidebar permissions
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VendorInvitation(Base):
    __tablename__ = "portal_vendor_invitations"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    vendor_name = Column(String, nullable=False)
    vendor_email = Column(String, nullable=False, index=True)
    vendor_phone = Column(String, nullable=True)
    company_name = Column(String, nullable=False)
    subdomain = Column(String, nullable=False, index=True)
    price = Column(Integer, nullable=False, default=0)
    currency = Column(String, default="INR")
    validity_days = Column(Integer, nullable=False, default=30)
    billing_note = Column(String, nullable=True)
    max_roles = Column(Integer, nullable=False, default=2)
    max_jobs = Column(Integer, nullable=False, default=5)
    max_candidates_per_job = Column(Integer, nullable=False, default=100)
    sidebar_access = Column(JSON, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, PAID, CANCELLED, EXPIRED
    created_by_user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=True)
    created_company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=True)
    created_user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=True)
    generated_password = Column(String, nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    payment_completed_at = Column(DateTime, nullable=True)
    invitation_sent_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


