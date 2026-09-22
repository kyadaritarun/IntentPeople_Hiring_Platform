from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class SupportTicket(Base):
    __tablename__ = "portal_support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False)
    subject = Column(String, nullable=False)
    category = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="support_tickets")
