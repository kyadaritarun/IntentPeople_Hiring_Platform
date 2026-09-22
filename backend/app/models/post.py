from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Post(Base):
    __tablename__ = "portal_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    tags = Column(JSON, default=list)  # e.g. ["#Marketing", "#OpenToWork", "#TeamCelebration"]
    likes_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan", order_by="PostComment.created_at.asc()")

class PostComment(Base):
    __tablename__ = "portal_post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("portal_posts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("portal_users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", backref="post_comments")
