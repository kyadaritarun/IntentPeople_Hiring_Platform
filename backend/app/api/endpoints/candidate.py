import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from typing import Optional
from app.database import get_db
from app import models, schemas
from app.api.deps import get_current_user
from app.api.endpoints.auth import format_candidate_profile
from app.services.scoring import _calculate_experience_years
from app.services.s3 import upload_file_to_s3

router = APIRouter(prefix="/candidates", tags=["Candidate Profile"])

@router.get("/me")
def get_candidate_profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can access candidate profile")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        candidate = models.Candidate(
            user_id=user.id,
            full_name=user.email.split("@")[0].title() if user.email else "Candidate",
            title="Candidate",
            city="Hyderabad",
            state="Telangana",
            summary=""
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
    return format_candidate_profile(candidate)

@router.put("/me")
def update_candidate(data: schemas.CandidateProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can update candidate profile")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        candidate = models.Candidate(
            user_id=user.id,
            full_name=data.full_name or (user.email.split("@")[0].title() if user.email else "Candidate"),
            title=data.title or "Candidate",
            city=data.city or "Hyderabad",
            state=data.state or "Telangana"
        )
        db.add(candidate)
        db.flush()

    json_fields = {"skills", "expertise", "experience", "education", "certifications", "hiring_preferences"}
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(candidate, field, val)
        if field in json_fields:
            flag_modified(candidate, field)

    db.commit()
    db.refresh(candidate)
    return format_candidate_profile(candidate)

@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can upload resume")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No resume file provided")

    file_url, original_filename = upload_file_to_s3(file=file, folder="resume", entity_id=candidate.id)
    candidate.resume_url = file_url
    candidate.resume_filename = original_filename

    db.commit()
    db.refresh(candidate)

    return {
        "message": "Resume uploaded successfully!",
        "resume_url": candidate.resume_url,
        "filename": candidate.resume_filename
    }

@router.post("/photo")
async def upload_candidate_photo(
    file: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can upload profile photo")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=candidate.id)
    candidate.avatar_url = file_url

    db.commit()
    db.refresh(candidate)

    return {
        "message": "Profile picture uploaded successfully!",
        "avatar_url": candidate.avatar_url
    }

@router.post("/cover")
async def upload_candidate_cover(
    file: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can upload cover picture")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No cover file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=candidate.id)
    candidate.cover_url = file_url

    db.commit()
    db.refresh(candidate)

    return {
        "message": "Cover photo uploaded successfully!",
        "cover_url": candidate.cover_url
    }


# ═══════════════════════════════════════════════════════════════════════
#   RECRUITER TALENT SOURCING & CANDIDATE SEARCH
# ═══════════════════════════════════════════════════════════════════════

@router.get("/search")
def search_candidates(
    q: Optional[str] = None,
    skills: Optional[str] = None,
    min_experience: Optional[float] = None,
    max_experience: Optional[float] = None,
    city: Optional[str] = None,
    work_mode: Optional[str] = None,
    limit: int = 50,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search all candidates in talent database for recruiters and company staff.
    Supports skill matching, experience filtering, keyword search, location, and work mode.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized staff can search candidates")

    candidates = db.query(models.Candidate).all()
    results = []

    # Parse query filters
    required_skills = [s.strip().lower() for s in skills.split(",") if s.strip()] if skills else []
    query_text = q.strip().lower() if q else None
    city_filter = city.strip().lower() if city else None
    work_mode_filter = work_mode.strip().lower() if work_mode else None

    for cand in candidates:
        cand_user = db.query(models.User).filter(models.User.id == cand.user_id).first() if cand.user_id else None

        # Calculate verified experience years
        exp_list = cand.experience or []
        total_exp = _calculate_experience_years(exp_list)

        # 1. Experience filter
        if min_experience is not None and total_exp < min_experience:
            continue
        if max_experience is not None and total_exp > max_experience:
            continue

        # 2. City / Location filter
        if city_filter:
            cand_city = f"{cand.city or ''} {cand.state or ''} {cand.place or ''}".lower()
            if city_filter not in cand_city:
                continue

        # 3. Work mode preference filter
        if work_mode_filter and work_mode_filter != "all":
            pref = getattr(cand, "hiring_preferences", {}) or {}
            cand_mode = str(pref.get("work_mode") or "").lower()
            if work_mode_filter not in cand_mode and cand_mode not in ["any", "open to all"]:
                continue

        # 4. Skills match
        cand_skills = [str(s).lower() for s in (cand.skills or [])] + [str(e).lower() for e in (getattr(cand, "expertise", []) or [])]
        matched_skills = []
        if required_skills:
            for req in required_skills:
                for cs in cand_skills:
                    if req in cs or cs in req:
                        matched_skills.append(cs)
                        break
            # If skills specified, candidate must have at least one matched skill
            if not matched_skills:
                continue

        # 5. General text search (name, title, summary, skills)
        if query_text:
            searchable_text = f"{cand.full_name or ''} {cand.title or ''} {cand.summary or ''} {' '.join(cand_skills)}".lower()
            # Split into words so "full stack" matches both
            words = query_text.split()
            if not any(w in searchable_text for w in words):
                continue

        # Format candidate output
        formatted = format_candidate_profile(cand)
        formatted["email"] = cand_user.email if cand_user else ""
        formatted["total_experience_years"] = round(total_exp, 1)
        formatted["matched_skills"] = list(set(matched_skills))
        results.append(formatted)

    # Sort results: candidates with most matched skills first, then most experienced
    if required_skills:
        results.sort(key=lambda x: (len(x.get("matched_skills", [])), x.get("total_experience_years", 0)), reverse=True)
    else:
        results.sort(key=lambda x: x.get("total_experience_years", 0), reverse=True)

    return results[:limit]


@router.get("/{candidate_id}")
def get_candidate_by_id(
    candidate_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full profile dossier of a specific candidate (for recruiter evaluation / PDF preview).
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized staff can view candidate profiles")

    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand_user = db.query(models.User).filter(models.User.id == cand.user_id).first() if cand.user_id else None
    formatted = format_candidate_profile(cand)
    formatted["email"] = cand_user.email if cand_user else ""
    formatted["total_experience_years"] = round(_calculate_experience_years(cand.experience or []), 1)
    return formatted

