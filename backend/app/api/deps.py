from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User
from app.core import security

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ")[1]
    payload = security.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_user_company(user: User, db: Session):
    """Resolve the company associated with an ADMIN, RECRUITER, or HIRING_MANAGER."""
    if user.company_profile:
        return user.company_profile
    if getattr(user, 'company_member_profile', None) and user.company_member_profile.company:
        return user.company_member_profile.company
    from app.models.company import CompanyMember, Company
    member = db.query(CompanyMember).filter(CompanyMember.user_id == user.id).first()
    if member:
        return db.query(Company).filter(Company.id == member.company_id).first()
    return db.query(Company).filter(Company.user_id == user.id).first()

