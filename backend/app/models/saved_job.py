from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class SavedJob(Base):
    __tablename__ = "portal_saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("portal_jobs.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_saved_job"),
    )

    user = relationship("User", backref="saved_jobs")
    job = relationship("Job", backref="saved_by_users")
