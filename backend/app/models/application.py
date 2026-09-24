from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Application(Base):
    __tablename__ = "portal_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("portal_jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("portal_candidates.id"), nullable=False)
    status = Column(String, default="APPLIED") # APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED
    cover_letter = Column(Text, nullable=True)
    screening_answers = Column(JSON, default=list, nullable=True) # Candidate responses to job screening questions
    fit_score = Column(Float, nullable=True, default=None)        # AI fit score (0-100)
    fit_breakdown = Column(JSON, nullable=True, default=None)     # Per-dimension breakdown
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")

