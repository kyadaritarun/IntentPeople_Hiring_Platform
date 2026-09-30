from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
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
