from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Interview(Base):
    __tablename__ = "portal_interviews"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("portal_applications.id"), nullable=True)
    job_title = Column(String, nullable=False)
    candidate_name = Column(String, nullable=False, default="Candidate")
    interviewer_name = Column(String, nullable=True)
    interview_date = Column(String, nullable=False)
    interview_time = Column(String, nullable=True)
    duration = Column(String, default="45 mins")
    round = Column(String, nullable=True)
    mode = Column(String, default="Google Meet")
    meet_url = Column(String, nullable=True)
    meeting_provider = Column(String, default="google_meet", nullable=True)
    meeting_url = Column(String, nullable=True)
    meeting_code = Column(String, nullable=True)
    google_space_name = Column(String, nullable=True)
    meeting_created_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="CONFIRMED")  # CONFIRMED, SCHEDULED, COMPLETED
    created_by = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
