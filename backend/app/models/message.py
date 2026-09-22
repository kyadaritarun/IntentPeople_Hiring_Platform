from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class InternalMessage(Base):
    __tablename__ = "portal_internal_messages"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("portal_companies.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    channel = Column(String, nullable=False, default="team-sync", index=True)
    sender_name = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)  # ADMIN, RECRUITER, HIRING_MANAGER
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
