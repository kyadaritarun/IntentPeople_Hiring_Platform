from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Candidate(Base):
    __tablename__ = "portal_candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    place = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    title = Column(String, nullable=True, default="Candidate")
    summary = Column(Text, nullable=True)
    skills = Column(JSON, default=list)
    expertise = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    education = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    hiring_preferences = Column(JSON, default=dict)
    
    # Rich Marketing Specialisation & Capability Matrix
    career_stage = Column(String, nullable=True) # Fresher / Working professional / Returning to work / Freelancer or consultant
    career_interests = Column(JSON, default=dict) # Desired roles, specialisations, responsibility level, compensation, joining timeline
    specialisations_data = Column(JSON, default=list) # 14 specialisations with proficiency, ownership, recency, duration, evidence, interest
    gtm_experience = Column(JSON, default=dict) # Customer model, revenue model, route-to-market, buyer personas, ACV, buying cycle
    case_studies = Column(JSON, default=list) # Guided campaign projects with before/after metrics & proof evidence
    execution_environment = Column(JSON, default=dict) # Budget managed, team structure, agency management, decision authority
    tools_proficiency = Column(JSON, default=list) # Tools stack (GA4, HubSpot, Meta Ads, etc.)
    onboarding_completed = Column(Boolean, default=False)
    onboarding_step = Column(Integer, default=1)

    resume_url = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    views_count = Column(Integer, default=0)
    top_search_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("Application", back_populates="candidate")
