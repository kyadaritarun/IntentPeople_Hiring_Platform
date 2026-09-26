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


def get_user_group_ids(user: User, db: Session) -> list:
    """Return all staff group IDs that the user belongs to via company member profile."""
    from app.models.company import CompanyMember, StaffGroupMember
    member = db.query(CompanyMember).filter(CompanyMember.user_id == user.id).first()
    if not member:
        return []
    memberships = db.query(StaffGroupMember).filter(StaffGroupMember.member_id == member.id).all()
    return [m.group_id for m in memberships]


def get_scoped_jobs_query(user: User, company_id: int, db: Session, requested_group_id: Optional[int] = None):
    """
    Scope jobs based on role and hiring group:
    - ADMIN: all jobs in company (or filtered by requested_group_id if provided).
    - RECRUITER / HIRING_MANAGER:
      - If requested_group_id is provided: verifies user belongs to that group, then returns only that group's jobs.
      - Otherwise: returns jobs belonging to all groups the user belongs to (or created by user).
      - If not assigned to any group: jobs created by the user.
    """
    from sqlalchemy import or_
    from app.models.job import Job

    base_query = db.query(Job).filter(Job.company_id == company_id)
    if user.role == "ADMIN":
        if requested_group_id:
            return base_query.filter(Job.group_id == requested_group_id)
        return base_query

    group_ids = get_user_group_ids(user, db)
    if requested_group_id:
        if requested_group_id in group_ids:
            return base_query.filter(Job.group_id == requested_group_id)
        else:
            # User does not belong to this group - deny access by returning empty query
            return base_query.filter(Job.id == -1)

    if group_ids:
        return base_query.filter(or_(Job.group_id.in_(group_ids), Job.created_by == user.id))
    else:
        return base_query.filter(Job.created_by == user.id)


def can_user_access_job(user: User, job, db: Session) -> bool:
    """Check if the staff member has permission to view or manage a job."""
    if not job:
        return False
    if user.role == "ADMIN":
        return True
    if job.created_by == user.id:
        return True
    if job.group_id:
        group_ids = get_user_group_ids(user, db)
        if job.group_id in group_ids:
            return True
    return False

