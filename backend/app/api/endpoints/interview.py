from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.api.deps import get_current_user, get_user_company

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("")
def create_interview(
    data: schemas.InterviewCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview. Only recruiters can schedule."""
    if user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can schedule interviews")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=400, detail="No company associated with this user")

    interview = models.Interview(
        company_id=company.id,
        application_id=data.application_id,
        job_title=data.job_title,
        candidate_name=data.candidate_name,
        interviewer_name=data.interviewer_name or user.email.split("@")[0],
        interview_date=data.interview_date,
        interview_time=data.interview_time,
        duration=data.duration,
        round=data.round,
        mode=data.mode,
        meet_url=data.meet_url,
        notes=data.notes,
        status=data.status or "CONFIRMED",
        created_by=user.id
    )
    db.add(interview)

    # If application_id is provided, notify the candidate
    if data.application_id:
        app_record = db.query(models.Application).filter(models.Application.id == data.application_id).first()
        if app_record:
            cand = db.query(models.Candidate).filter(models.Candidate.id == app_record.candidate_id).first()
            if cand and cand.user_id:
                notif = models.Notification(
                    user_id=cand.user_id,
                    type="INTERVIEW_SCHEDULED",
                    title="Interview Scheduled!",
                    message=f"Your interview for '{data.job_title}' is scheduled on {data.interview_date} ({data.interview_time})."
                )
                db.add(notif)

    db.commit()
    db.refresh(interview)

    return {
        "message": "Interview scheduled successfully",
        "interview": _serialize_interview(interview, db)
    }


@router.get("")
def get_interviews(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List interviews: for staff, all company interviews; for candidates, their scheduled interviews."""
    if user.role in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        company = get_user_company(user, db)
        if not company:
            return []

        interviews = (
            db.query(models.Interview)
            .filter(models.Interview.company_id == company.id)
            .order_by(models.Interview.created_at.desc())
            .all()
        )

        return [_serialize_interview(iv, db) for iv in interviews]

    elif user.role == "CANDIDATE":
        candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        if not candidate:
            return []

        # Find application IDs for this candidate
        cand_apps = db.query(models.Application).filter(models.Application.candidate_id == candidate.id).all()
        app_ids = [a.id for a in cand_apps]

        from sqlalchemy import or_
        conditions = []
        if app_ids:
            conditions.append(models.Interview.application_id.in_(app_ids))
        if candidate.full_name and candidate.full_name.strip():
            conditions.append(models.Interview.candidate_name.ilike(f"%{candidate.full_name.strip()}%"))

        if not conditions:
            return []

        interviews = (
            db.query(models.Interview)
            .filter(or_(*conditions))
            .order_by(models.Interview.created_at.desc())
            .all()
        )

        return [_serialize_interview(iv, db) for iv in interviews]

    else:
        return []


@router.patch("/{interview_id}")
def update_interview(
    interview_id: int,
    data: schemas.InterviewUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update/reschedule an interview. Only recruiters can modify."""
    if user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can update interviews")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=400, detail="No company associated with this user")

    interview = (
        db.query(models.Interview)
        .filter(models.Interview.id == interview_id, models.Interview.company_id == company.id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if data.interview_date is not None:
        interview.interview_date = data.interview_date
    if data.interview_time is not None:
        interview.interview_time = data.interview_time
    if data.status is not None:
        interview.status = data.status
    if data.notes is not None:
        interview.notes = data.notes
    if data.round is not None:
        interview.round = data.round
    if data.interviewer_name is not None:
        interview.interviewer_name = data.interviewer_name
    if data.mode is not None:
        interview.mode = data.mode
    if data.duration is not None:
        interview.duration = data.duration
    if data.meet_url is not None:
        interview.meet_url = data.meet_url
        interview.meeting_url = data.meet_url
        if data.meet_url and "meet.google.com/" in data.meet_url:
            interview.meeting_provider = "google_meet"
            interview.meeting_code = data.meet_url.split("meet.google.com/")[-1].split("?")[0]

    db.commit()
    db.refresh(interview)

    return {
        "message": "Interview updated successfully",
        "interview": _serialize_interview(interview)
    }


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an interview. Only recruiters can delete."""
    if user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can delete interviews")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=400, detail="No company associated with this user")

    interview = (
        db.query(models.Interview)
        .filter(models.Interview.id == interview_id, models.Interview.company_id == company.id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    db.delete(interview)
    db.commit()

    return {"message": "Interview deleted successfully"}


@router.post("/spaces/create")
def create_standalone_meet_space(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an official Google Meet space on-the-fly for modal scheduling.
    Does not require a pre-existing interview record.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only recruiters and hiring staff can create Google Meet spaces")

    from app.services.google_meet_service import GoogleMeetService
    access_token = GoogleMeetService.get_valid_access_token(user.id, db)
    space = GoogleMeetService.create_meeting_space(access_token)

    return {
        "success": True,
        "meetingUrl": space["meeting_url"],
        "meetingCode": space["meeting_code"],
        "spaceName": space.get("space_name", "")
    }


@router.post("/{interview_id}/google-meet")
def create_google_meet_for_interview(
    interview_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or retrieve official Google Meet session for an interview.
    - Validates recruiter permissions.
    - Prevents duplicate space creation if meeting_url already exists.
    - Uses official Google Meet REST API v2 spaces.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only recruiters and hiring staff can create Google Meet sessions")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=400, detail="No company associated with this user")

    interview = (
        db.query(models.Interview)
        .filter(models.Interview.id == interview_id, models.Interview.company_id == company.id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview record not found")

    # 1. Prevent duplicate meetings: Return existing if already provisioned
    existing_url = interview.meeting_url or (interview.meet_url if (interview.meet_url and "meet.google.com" in interview.meet_url and "upt-" not in interview.meet_url) else None)
    if existing_url:
        return {
            "success": True,
            "meeting": {
                "provider": interview.meeting_provider or "google_meet",
                "meetingUrl": existing_url,
                "meetingCode": interview.meeting_code or (existing_url.split("/")[-1] if "/" in existing_url else ""),
                "spaceName": interview.google_space_name or ""
            }
        }

    # 2. Get valid Google access token for the recruiter
    from app.services.google_meet_service import GoogleMeetService
    from datetime import datetime

    access_token = GoogleMeetService.get_valid_access_token(user.id, db)

    # 3. Call Google Meet REST API v2
    space = GoogleMeetService.create_meeting_space(access_token)

    # 4. Save to PostgreSQL
    interview.meeting_provider = "google_meet"
    interview.meeting_url = space["meeting_url"]
    interview.meet_url = space["meeting_url"]  # maintain backwards compatibility
    interview.meeting_code = space["meeting_code"]
    interview.google_space_name = space["space_name"]
    interview.meeting_created_at = datetime.utcnow()
    interview.mode = "Google Meet"

    db.commit()
    db.refresh(interview)

    return {
        "success": True,
        "meeting": {
            "provider": "google_meet",
            "meetingUrl": space["meeting_url"],
            "meetingCode": space["meeting_code"],
            "spaceName": space["space_name"]
        }
    }


def _serialize_interview(iv, db: Session = None):
    """Convert an Interview ORM object to a JSON-safe dict."""
    company_name = "Uptrix Partner"
    if db and iv.company_id:
        comp = db.query(models.Company).filter(models.Company.id == iv.company_id).first()
        if comp and comp.company_name:
            company_name = comp.company_name

    return {
        "id": iv.id,
        "company_id": iv.company_id,
        "company_name": company_name,
        "application_id": iv.application_id,
        "job_title": iv.job_title,
        "candidate_name": iv.candidate_name,
        "interviewer_name": iv.interviewer_name,
        "interview_date": iv.interview_date,
        "interview_time": iv.interview_time,
        "duration": iv.duration,
        "round": iv.round,
        "mode": iv.mode,
        "meet_url": iv.meet_url,
        "meeting_provider": getattr(iv, "meeting_provider", "google_meet"),
        "meeting_url": getattr(iv, "meeting_url", None) or iv.meet_url,
        "meeting_code": getattr(iv, "meeting_code", None),
        "google_space_name": getattr(iv, "google_space_name", None),
        "meeting_created_at": iv.meeting_created_at.isoformat() if getattr(iv, "meeting_created_at", None) else None,
        "notes": iv.notes,
        "status": iv.status,
        "created_by": iv.created_by,
        "created_at": iv.created_at.isoformat() if iv.created_at else None,
        "updated_at": iv.updated_at.isoformat() if iv.updated_at else None,
    }
