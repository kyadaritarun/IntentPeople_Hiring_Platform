from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Job(Base):
    __tablename__ = "portal_jobs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(JSON, default=list)
    experience_level = Column(String, nullable=True)
    ownership_level = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    must_have_capabilities = Column(Text, nullable=True)
    preferred_capabilities = Column(Text, nullable=True)
    availability_requirement = Column(String, nullable=True)
    min_experience = Column(String, nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String, default="USD")
    location = Column(String, nullable=False)
    work_mode = Column(String, nullable=False)  # Remote, Hybrid, On-site
    job_type = Column(String, nullable=False)   # Full-Time, Part-Time, Contract, Internship
    status = Column(String, default="PUBLISHED") # DRAFT, PUBLISHED, CLOSED
    product_service = Column(Text, nullable=True)
    business_model = Column(String, nullable=True)
    growth_stage = Column(String, nullable=True)
    target_audience = Column(Text, nullable=True)
    ideal_customer_profile = Column(Text, nullable=True)
    business_problem = Column(Text, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    team_support = Column(Text, nullable=True)
    monthly_budget_range = Column(String, nullable=True)
    decision_authority = Column(String, nullable=True)
    success_horizon = Column(String, nullable=True)
    screening_questions = Column(JSON, default=list, nullable=True) # List of custom screening questions
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")
