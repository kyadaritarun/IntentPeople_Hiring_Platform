from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app import models, schemas
from app.api.deps import (
    get_current_user,
    get_user_company,
    get_scoped_jobs_query,
    can_user_access_job
)
from app.services.scoring import score_candidate_for_job, CandidateScorer

router = APIRouter(prefix="/applications", tags=["Applications & ATS"])


# ── Helper: Build candidate data dict for scorer ────────────────────────
def _candidate_to_dict(cand):
    """Convert a Candidate model instance to a dict for the scorer."""
    if not cand:
        return {}
    return {
        "id": cand.id,
        "full_name": cand.full_name,
        "title": cand.title,
        "summary": cand.summary,
        "skills": cand.skills or [],
        "expertise": getattr(cand, "expertise", []) or [],
        "experience": cand.experience or [],
        "education": cand.education or [],
        "certifications": getattr(cand, "certifications", []) or [],
        "hiring_preferences": getattr(cand, "hiring_preferences", {}) or {},
        "resume_url": cand.resume_url,
        "portfolio_url": cand.portfolio_url,
        "avatar_url": cand.avatar_url,
        "phone": cand.phone,
        "city": cand.city,
        "state": cand.state,
    }


def _job_to_dict(job):
    """Convert a Job model instance to a dict for the scorer."""
    if not job:
        return {}
    return {
        "title": job.title,
        "description": job.description,
        "skills": job.skills or [],
        "experience_level": job.experience_level,
        "specialization": job.specialization,
        "must_have_capabilities": job.must_have_capabilities,
        "preferred_capabilities": job.preferred_capabilities,
        "min_experience": job.min_experience,
    }


def _build_applicant_response(a, cand, job, cand_user=None):
    """Build a single applicant response dict with fit_score data."""
    return {
        "id": a.id,
        "job_id": a.job_id,
        "job_title": job.title if job else "Position",
        "job_location": job.location if job else "",
        "job_work_mode": job.work_mode if job else "",
        "group_id": getattr(job, "group_id", None) if job else None,
        "group_name": job.group.name if (job and getattr(job, "group", None)) else None,
        "interview_rounds": getattr(job, "interview_rounds", []) or [] if job else [],
        "status": a.status,
        "cover_letter": a.cover_letter,
        "screening_answers": a.screening_answers or [],
        "fit_score": a.fit_score,
        "fit_breakdown": a.fit_breakdown,
        "applied_at": a.applied_at.isoformat() if a.applied_at else None,
        "candidate": {
            "id": cand.id if cand else None,
            "full_name": cand.full_name if cand else "Candidate",
            "email": cand_user.email if cand_user else "",
            "avatar_url": cand.avatar_url if cand else None,
            "title": cand.title if cand else "",
            "city": cand.city if cand else "",
            "state": cand.state if cand else "",
            "phone": cand.phone if cand else "",
            "summary": cand.summary if cand else "",
            "skills": cand.skills if cand else [],
            "expertise": getattr(cand, "expertise", []) or [],
            "experience": cand.experience if cand else [],
            "education": cand.education if cand else [],
            "certifications": getattr(cand, "certifications", []) or [],
            "hiring_preferences": getattr(cand, "hiring_preferences", {}) or {},
            "resume_url": cand.resume_url if cand else None,
            "resume_filename": cand.resume_filename if cand else None,
            "portfolio_url": cand.portfolio_url if cand else None
        }
    }


# ═══════════════════════════════════════════════════════════════════════
#  APPLY FOR A JOB (with auto-scoring)
# ═══════════════════════════════════════════════════════════════════════

@router.post("/job/{job_id}/apply")
@router.post("/{job_id}/apply")
def apply_job(job_id: int, data: schemas.ApplicationCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can apply for jobs")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        candidate = models.Candidate(
            user_id=user.id,
            full_name=user.email.split("@")[0] if user.email else "Candidate",
            title="Candidate",
            summary="Candidate profile"
        )
        db.add(candidate)
        db.flush()

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(models.Application).filter(
        models.Application.job_id == job_id, 
        models.Application.candidate_id == candidate.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job position")

    # Auto-compute fit score
    try:
        score_result = score_candidate_for_job(_job_to_dict(job), _candidate_to_dict(candidate))
        fit_score = score_result["total"]
        fit_breakdown = score_result
    except Exception:
        fit_score = None
        fit_breakdown = None

    app = models.Application(
        job_id=job_id,
        candidate_id=candidate.id,
        status="APPLIED",
        cover_letter=data.cover_letter,
        screening_answers=data.screening_answers or [],
        fit_score=fit_score,
        fit_breakdown=fit_breakdown,
    )
    db.add(app)

    recruiter_user_id = job.company.user_id if job.company else None
    if recruiter_user_id:
        score_label = f" (Fit Score: {fit_score}%)" if fit_score is not None else ""
        notif = models.Notification(
            user_id=recruiter_user_id,
            type="NEW_APPLICATION",
            title="New Job Applicant!",
            message=f"{candidate.full_name} applied for '{job.title}'{score_label}."
        )
        db.add(notif)

    db.commit()
    return {"message": "Job application submitted successfully!", "fit_score": fit_score}


# ═══════════════════════════════════════════════════════════════════════
#  MY APPLICATIONS (candidate view)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/my")
def get_my_applications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can view submitted applications")
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if not candidate:
        return []

    apps = db.query(models.Application).filter(models.Application.candidate_id == candidate.id).order_by(models.Application.id.desc()).all()
    result = []
    for a in apps:
        j = db.query(models.Job).filter(models.Job.id == a.job_id).first()
        comp = db.query(models.Company).filter(models.Company.id == j.company_id).first() if j else None
        
        # Query interview associated with this application or candidate
        iv = db.query(models.Interview).filter(models.Interview.application_id == a.id).order_by(models.Interview.id.desc()).first()
        if not iv and j and candidate:
            cand_name = candidate.full_name or ""
            iv = db.query(models.Interview).filter(
                models.Interview.job_title == j.title,
                models.Interview.candidate_name == cand_name
            ).order_by(models.Interview.id.desc()).first()

        iv_data = None
        if iv:
            meet_url = iv.meeting_url or iv.meet_url
            iv_data = {
                "id": iv.id,
                "job_title": iv.job_title,
                "candidate_name": iv.candidate_name,
                "interviewer_name": iv.interviewer_name,
                "interview_date": iv.interview_date,
                "interview_time": iv.interview_time,
                "duration": iv.duration,
                "round": iv.round,
                "mode": iv.mode,
                "meeting_provider": iv.meeting_provider or "google_meet",
                "meeting_url": meet_url,
                "meeting_code": iv.meeting_code,
                "notes": iv.notes,
                "status": iv.status,
            }

        result.append({
            "id": a.id,
            "job_id": a.job_id,
            "status": a.status,
            "cover_letter": a.cover_letter,
            "fit_score": a.fit_score,
            "fit_breakdown": a.fit_breakdown,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "interview": iv_data,
            "job": {
                "id": j.id if j else None,
                "title": j.title if j else "Position",
                "location": j.location if j else "",
                "work_mode": j.work_mode if j else "",
                "job_type": j.job_type if j else "Full-Time",
                "experience_level": j.experience_level if j else "",
                "salary_min": j.salary_min if j else None,
                "salary_max": j.salary_max if j else None,
                "skills": j.skills if j else [],
                "description": j.description if j else "",
                "interview_rounds": getattr(j, "interview_rounds", []) or [] if j else [],
                "company_name": comp.company_name if comp else "Agency"
            }
        })
    return result


# ═══════════════════════════════════════════════════════════════════════
#  JOB APPLICANTS (recruiter view)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/job/{job_id}")
def get_job_applicants(job_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized company staff can view job applicants")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to view applicants for this job")

    apps = db.query(models.Application).filter(models.Application.job_id == job_id).order_by(models.Application.id.desc()).all()
    result = []
    for a in apps:
        cand = db.query(models.Candidate).filter(models.Candidate.id == a.candidate_id).first()
        cand_user = db.query(models.User).filter(models.User.id == cand.user_id).first() if (cand and cand.user_id) else None
        result.append(_build_applicant_response(a, cand, job, cand_user))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  TOP N CANDIDATES FOR A JOB (AI-ranked)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/job/{job_id}/top")
def get_top_candidates(
    job_id: int,
    count: int = Query(default=10, ge=1, le=500, description="Number of top candidates to return"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the top N best-fit candidates for a job, ranked by AI fit score.
    Recruiter can specify how many to see (e.g., top 10, top 30).
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized staff can view top candidates")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to view top candidates for this job")

    # Get all applications for this job, ordered by fit_score descending
    apps = (
        db.query(models.Application)
        .filter(models.Application.job_id == job_id)
        .order_by(models.Application.fit_score.desc().nullslast())
        .limit(count)
        .all()
    )

    result = []
    for rank, a in enumerate(apps, 1):
        cand = db.query(models.Candidate).filter(models.Candidate.id == a.candidate_id).first()
        cand_user = db.query(models.User).filter(models.User.id == cand.user_id).first() if (cand and cand.user_id) else None
        entry = _build_applicant_response(a, cand, job, cand_user)
        entry["rank"] = rank
        result.append(entry)

    return {
        "job_id": job_id,
        "job_title": job.title,
        "total_applicants": db.query(models.Application).filter(models.Application.job_id == job_id).count(),
        "showing_top": len(result),
        "candidates": result
    }


# ═══════════════════════════════════════════════════════════════════════
#  RESCORE ALL CANDIDATES FOR A JOB
# ═══════════════════════════════════════════════════════════════════════

@router.post("/job/{job_id}/rescore")
def rescore_job_candidates(
    job_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-compute fit scores for all applicants of a job.
    Useful after job requirements change or candidate profiles update.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized staff can rescore candidates")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to rescore candidates for this job")

    apps = db.query(models.Application).filter(models.Application.job_id == job_id).all()
    job_dict = _job_to_dict(job)
    scorer = CandidateScorer(job_dict)
    scored_count = 0

    for a in apps:
        cand = db.query(models.Candidate).filter(models.Candidate.id == a.candidate_id).first()
        if cand:
            try:
                result = scorer.score(_candidate_to_dict(cand))
                a.fit_score = result["total"]
                a.fit_breakdown = result
                scored_count += 1
            except Exception:
                pass

    db.commit()
    return {
        "message": f"Successfully re-scored {scored_count} candidates for '{job.title}'",
        "job_id": job_id,
        "scored_count": scored_count,
        "total_applicants": len(apps)
    }


# ═══════════════════════════════════════════════════════════════════════
#  COMPANY ALL APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/company/all")
def get_company_all_applications(
    group_id: Optional[int] = Query(None, description="Optional hiring pod/group filter"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized company staff can view company applications")

    company = get_user_company(user, db)
    if not company:
        return []

    jobs = get_scoped_jobs_query(user, company.id, db, requested_group_id=group_id).all()
    job_map = {j.id: j for j in jobs}
    if not job_map:
        return []

    apps = db.query(models.Application).filter(models.Application.job_id.in_(list(job_map.keys()))).order_by(models.Application.id.desc()).all()
    result = []
    for a in apps:
        cand = db.query(models.Candidate).filter(models.Candidate.id == a.candidate_id).first()
        job = job_map.get(a.job_id)
        cand_user = db.query(models.User).filter(models.User.id == cand.user_id).first() if (cand and cand.user_id) else None
        result.append(_build_applicant_response(a, cand, job, cand_user))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  UPDATE APPLICATION STATUS
# ═══════════════════════════════════════════════════════════════════════

@router.patch("/{app_id}/status")
def update_application_status(app_id: int, data: schemas.ApplicationStatusUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only authorized company staff can update applicant status")

    app_obj = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    app_obj.status = data.status

    candidate = db.query(models.Candidate).filter(models.Candidate.id == app_obj.candidate_id).first()
    job = db.query(models.Job).filter(models.Job.id == app_obj.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to update candidates outside your hiring group")

    if candidate and job:
        notif = models.Notification(
            user_id=candidate.user_id,
            type="APPLICATION_STATUS",
            title=f"Application Update: {data.status.replace('_', ' ').title()}",
            message=f"Your application status for '{job.title}' was updated to {data.status.replace('_', ' ').title()}."
        )
        db.add(notif)

    db.commit()
    return {"message": "Application status updated successfully", "status": app_obj.status}
