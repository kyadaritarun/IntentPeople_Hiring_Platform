from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app import models, schemas
from app.api.deps import (
    get_current_user,
    get_user_company,
    get_user_group_ids,
    get_scoped_jobs_query,
    can_user_access_job
)
from app.core.job_hash import encode_job_id, decode_job_id

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("")
def get_jobs(search: Optional[str] = None, work_mode: Optional[str] = None, location: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Job).filter(models.Job.status == "PUBLISHED")

    if search:
        s = f"%{search}%"
        query = query.filter((models.Job.title.ilike(s)) | (models.Job.description.ilike(s)))
    if work_mode:
        query = query.filter(models.Job.work_mode == work_mode)
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))

    jobs = query.order_by(models.Job.id.desc()).all()

    result = []
    for j in jobs:
        company = db.query(models.Company).filter(models.Company.id == j.company_id).first()
        b_context = {
            "product_service": j.product_service or (company.product_service if company else "") or "",
            "business_model": j.business_model or (company.business_model if company else "") or "",
            "growth_stage": j.growth_stage or (company.growth_stage if company else "") or "",
            "target_audience": j.target_audience or (company.target_audience if company else "") or "",
            "ideal_customer_profile": j.ideal_customer_profile or (company.ideal_customer_profile if company else "") or ""
        }
        h_need = {
            "business_problem": j.business_problem or (company.business_problem if company else "") or "",
            "expected_outcome": j.expected_outcome or (company.expected_outcome if company else "") or "",
            "team_support": j.team_support or (company.team_support if company else "") or "",
            "monthly_budget_range": j.monthly_budget_range or (company.monthly_budget_range if company else "") or "",
            "decision_authority": j.decision_authority or (company.decision_authority if company else "") or "",
            "success_horizon": j.success_horizon or (company.success_horizon if company else "") or ""
        }
        applicant_count = db.query(models.Application).filter(models.Application.job_id == j.id).count()
        result.append({
            "id": j.id,
            "share_code": encode_job_id(j.id),
            "title": j.title,
            "description": j.description,
            "skills": j.skills or [],
            "experience_level": j.experience_level or j.ownership_level,
            "ownership_level": j.ownership_level,
            "specialization": j.specialization,
            "must_have_capabilities": j.must_have_capabilities,
            "preferred_capabilities": j.preferred_capabilities,
            "availability_requirement": j.availability_requirement,
            "min_experience": j.min_experience,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "salary_currency": j.salary_currency,
            "location": j.location,
            "work_mode": j.work_mode,
            "job_type": j.job_type,
            "status": j.status,
            "group_id": j.group_id,
            "group_name": j.group.name if j.group else None,
            "created_by": j.created_by,
            "screening_questions": j.screening_questions or [],
            "interview_rounds": j.interview_rounds or [],
            "applicant_count": applicant_count,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "business_context": b_context,
            "hiring_need": h_need,
            "company": {
                "id": company.id if company else None,
                "company_name": company.company_name if company else "Digital Agency",
                "logo_url": company.logo_url if company else None,
                "is_verified": company.is_verified if company else False,
                "website": company.website if company else "",
                "industry": company.industry if company else "Digital Marketing",
                "about": company.about if company else "",
                "product_service": company.product_service if company else "",
                "business_model": company.business_model if company else "",
                "growth_stage": company.growth_stage if company else "",
                "target_audience": company.target_audience if company else "",
                "ideal_customer_profile": company.ideal_customer_profile if company else "",
                "business_problem": company.business_problem if company else "",
                "expected_outcome": company.expected_outcome if company else "",
                "team_support": company.team_support if company else "",
                "monthly_budget_range": company.monthly_budget_range if company else "",
                "decision_authority": company.decision_authority if company else "",
                "success_horizon": company.success_horizon if company else ""
            }
        })
    return result

@router.get("/my")
def get_my_jobs(
    group_id: Optional[int] = Query(None, description="Optional hiring pod/group filter"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only company staff can access company jobs")
    company = get_user_company(user, db)
    if not company:
        return []

    jobs = get_scoped_jobs_query(user, company.id, db, requested_group_id=group_id).order_by(models.Job.id.desc()).all()
    result = []
    for j in jobs:
        applicant_count = db.query(models.Application).filter(models.Application.job_id == j.id).count()
        b_context = {
            "product_service": j.product_service or (company.product_service if company else "") or "",
            "business_model": j.business_model or (company.business_model if company else "") or "",
            "growth_stage": j.growth_stage or (company.growth_stage if company else "") or "",
            "target_audience": j.target_audience or (company.target_audience if company else "") or "",
            "ideal_customer_profile": j.ideal_customer_profile or (company.ideal_customer_profile if company else "") or ""
        }
        h_need = {
            "business_problem": j.business_problem or (company.business_problem if company else "") or "",
            "expected_outcome": j.expected_outcome or (company.expected_outcome if company else "") or "",
            "team_support": j.team_support or (company.team_support if company else "") or "",
            "monthly_budget_range": j.monthly_budget_range or (company.monthly_budget_range if company else "") or "",
            "decision_authority": j.decision_authority or (company.decision_authority if company else "") or "",
            "success_horizon": j.success_horizon or (company.success_horizon if company else "") or ""
        }
        result.append({
            "id": j.id,
            "share_code": encode_job_id(j.id),
            "title": j.title,
            "description": j.description,
            "skills": j.skills or [],
            "experience_level": j.experience_level or j.ownership_level,
            "ownership_level": j.ownership_level,
            "specialization": j.specialization,
            "must_have_capabilities": j.must_have_capabilities,
            "preferred_capabilities": j.preferred_capabilities,
            "availability_requirement": j.availability_requirement,
            "min_experience": j.min_experience,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "salary_currency": j.salary_currency,
            "location": j.location,
            "work_mode": j.work_mode,
            "job_type": j.job_type,
            "status": j.status,
            "group_id": j.group_id,
            "group_name": j.group.name if j.group else None,
            "created_by": j.created_by,
            "screening_questions": j.screening_questions or [],
            "interview_rounds": j.interview_rounds or [],
            "applicant_count": applicant_count,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "business_context": b_context,
            "hiring_need": h_need,
            "company": {
                "id": company.id if company else None,
                "company_name": company.company_name if company else "Digital Agency",
                "logo_url": company.logo_url if company else None,
                "is_verified": company.is_verified if company else False,
                "website": company.website if company else "",
                "industry": company.industry if company else "Digital Marketing",
                "about": company.about if company else "",
                "product_service": company.product_service if company else "",
                "business_model": company.business_model if company else "",
                "growth_stage": company.growth_stage if company else "",
                "target_audience": company.target_audience if company else "",
                "ideal_customer_profile": company.ideal_customer_profile if company else "",
                "business_problem": company.business_problem if company else "",
                "expected_outcome": company.expected_outcome if company else "",
                "team_support": company.team_support if company else "",
                "monthly_budget_range": company.monthly_budget_range if company else "",
                "decision_authority": company.decision_authority if company else "",
                "success_horizon": company.success_horizon if company else ""
            }
        })
    return result

@router.post("", status_code=201)
def create_job(data: schemas.JobCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can post jobs")
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    assigned_group_id = data.group_id
    user_group_ids = get_user_group_ids(user, db)

    if user.role != "ADMIN":
        if assigned_group_id:
            if assigned_group_id not in user_group_ids:
                raise HTTPException(status_code=403, detail="You can only assign jobs to your hiring pod / group")
        elif user_group_ids:
            assigned_group_id = user_group_ids[0]
    elif assigned_group_id:
        grp = db.query(models.StaffGroup).filter(
            models.StaffGroup.id == assigned_group_id,
            models.StaffGroup.company_id == company.id
        ).first()
        if not grp:
            raise HTTPException(status_code=404, detail="Selected hiring group not found")

    # Enforce job posting limit according to subscription plan
    existing_jobs_count = db.query(models.Job).filter(models.Job.company_id == company.id).count()
    max_jobs = company.max_jobs or (4 if company.plan_type == 'PLAN_4999' else (8 if company.plan_type == 'PLAN_14999' else 1))
    if existing_jobs_count >= max_jobs:
        plan_name = "₹4,999 (45-Day) Plan" if company.plan_type == 'PLAN_4999' else ("₹14,999/Month Plan" if company.plan_type == 'PLAN_14999' else "Free Plan")
        raise HTTPException(
            status_code=403,
            detail=f"Job posting limit reached ({existing_jobs_count}/{max_jobs}) for your {plan_name}. Please upgrade your subscription plan to post additional job requisitions."
        )

    job = models.Job(
        company_id=company.id,
        created_by=user.id,
        group_id=assigned_group_id,
        title=data.title,
        description=data.description,
        skills=data.skills,
        experience_level=data.experience_level or data.ownership_level or "Mid Level",
        ownership_level=data.ownership_level,
        specialization=data.specialization,
        must_have_capabilities=data.must_have_capabilities,
        preferred_capabilities=data.preferred_capabilities,
        availability_requirement=data.availability_requirement,
        min_experience=data.min_experience,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        salary_currency=data.salary_currency,
        location=data.location,
        work_mode=data.work_mode,
        job_type=data.job_type,
        status="PUBLISHED",
        product_service=data.product_service or (company.product_service if company else None),
        business_model=data.business_model or (company.business_model if company else None),
        growth_stage=data.growth_stage or (company.growth_stage if company else None),
        target_audience=data.target_audience or (company.target_audience if company else None),
        ideal_customer_profile=data.ideal_customer_profile or (company.ideal_customer_profile if company else None),
        business_problem=data.business_problem or (company.business_problem if company else None),
        expected_outcome=data.expected_outcome or (company.expected_outcome if company else None),
        team_support=data.team_support or (company.team_support if company else None),
        monthly_budget_range=data.monthly_budget_range or (company.monthly_budget_range if company else None),
        decision_authority=data.decision_authority or (company.decision_authority if company else None),
        success_horizon=data.success_horizon or (company.success_horizon if company else None),
        screening_questions=data.screening_questions or [],
        interview_rounds=data.interview_rounds or []
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.put("/{job_id}")
def update_job(
    job_id: int, 
    data: schemas.job.JobUpdate, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can edit jobs")
    
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.company_id != company.id:
        raise HTTPException(status_code=403, detail="Unauthorized to edit another organization's job")

    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to edit jobs outside your hiring group")

    update_dict = data.model_dump(exclude_unset=True)
    if "group_id" in update_dict and update_dict["group_id"] is not None:
        new_gid = update_dict["group_id"]
        if user.role != "ADMIN" and new_gid not in get_user_group_ids(user, db):
            raise HTTPException(status_code=403, detail="Cannot assign job to a hiring group you do not belong to")

    for field, val in update_dict.items():
        setattr(job, field, val)

    db.commit()
    db.refresh(job)
    return job

@router.patch("/{job_id}/status")
def update_job_status(job_id: int, data: schemas.JobStatusUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can update job status")
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not can_user_access_job(user, job, db):
        raise HTTPException(status_code=403, detail="You do not have permission to update jobs outside your hiring group")

    job.status = data.status
    db.commit()
    return {"message": f"Job status updated to {data.status}", "status": job.status}

@router.post("/{job_id}/apply", status_code=201)
def apply_to_job(job_id: int, data: schemas.ApplicationCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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

    app = models.Application(
        job_id=job_id,
        candidate_id=candidate.id,
        status="APPLIED",
        cover_letter=data.cover_letter,
        screening_answers=data.screening_answers or []
    )
    db.add(app)

    notif_user_ids = set()
    if job.created_by:
        notif_user_ids.add(job.created_by)
    if job.group_id:
        group_members = (
            db.query(models.CompanyMember.user_id)
            .join(models.StaffGroupMember, models.StaffGroupMember.member_id == models.CompanyMember.id)
            .filter(models.StaffGroupMember.group_id == job.group_id)
            .all()
        )
        for gm in group_members:
            if gm[0]:
                notif_user_ids.add(gm[0])
    if not notif_user_ids and job.company and job.company.user_id:
        notif_user_ids.add(job.company.user_id)

    for uid in notif_user_ids:
        notif = models.Notification(
            user_id=uid,
            type="NEW_APPLICATION",
            title="New Job Applicant!",
            message=f"{candidate.full_name} applied for '{job.title}'."
        )
        db.add(notif)

    db.commit()
    return {"message": "Job application submitted successfully!"}

@router.get("/saved")
def get_saved_jobs(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch all saved/bookmarked jobs for the current logged-in user."""
    saved_records = (
        db.query(models.SavedJob)
        .filter(models.SavedJob.user_id == user.id)
        .order_by(models.SavedJob.created_at.desc())
        .all()
    )

    results = []
    for sr in saved_records:
        j = sr.job
        if not j:
            continue
        company = db.query(models.Company).filter(models.Company.id == j.company_id).first()
        results.append({
            "id": j.id,
            "job_id": j.id,
            "share_code": encode_job_id(j.id),
            "title": j.title,
            "company": company.company_name if company else "Digital Agency",
            "company_id": company.id if company else None,
            "logo_url": company.logo_url if company else None,
            "location": j.location,
            "work_mode": j.work_mode,
            "job_type": j.job_type,
            "experience_level": j.experience_level or j.ownership_level,
            "salary": f"${j.salary_min:,} - ${j.salary_max:,} / yr" if (j.salary_min and j.salary_max) else "Competitive",
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "description": j.description,
            "skills": j.skills or [],
            "screening_questions": j.screening_questions or [],
            "date_saved": sr.created_at.isoformat() if sr.created_at else None,
            "dateSaved": sr.created_at.strftime("%b %d, %Y") if sr.created_at else "Saved recently"
        })
    return results

@router.post("/{job_id}/save")
def save_job(job_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Bookmark/save a job on the server."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if existing:
        return {"message": "Job already saved", "saved": True, "job_id": job_id}

    saved = models.SavedJob(user_id=user.id, job_id=job_id)
    db.add(saved)
    db.commit()
    return {"message": "Job saved successfully", "saved": True, "job_id": job_id}

@router.delete("/{job_id}/save")
@router.post("/{job_id}/unsave")
def unsave_job(job_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a bookmark/saved job from the server."""
    existing = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    return {"message": "Job removed from saved list", "saved": False, "job_id": job_id}

@router.get("/{job_identifier}")
def get_job(job_identifier: str, db: Session = Depends(get_db)):
    """Fetch details of a specific job by short code or ID (public access for shared links)."""
    real_id = decode_job_id(job_identifier)
    if not real_id:
        raise HTTPException(status_code=404, detail="Job position not found")

    j = db.query(models.Job).filter(models.Job.id == real_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job position not found")

    # Prevent public access to drafts, closed, or unpublished jobs
    if j.status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="This job opening is currently unavailable or inactive")

    company = db.query(models.Company).filter(models.Company.id == j.company_id).first()
    b_context = {
        "product_service": j.product_service or (company.product_service if company else "") or "",
        "business_model": j.business_model or (company.business_model if company else "") or "",
        "growth_stage": j.growth_stage or (company.growth_stage if company else "") or "",
        "target_audience": j.target_audience or (company.target_audience if company else "") or "",
        "ideal_customer_profile": j.ideal_customer_profile or (company.ideal_customer_profile if company else "") or ""
    }
    h_need = {
        "business_problem": j.business_problem or (company.business_problem if company else "") or "",
        "expected_outcome": j.expected_outcome or (company.expected_outcome if company else "") or "",
        "team_support": j.team_support or (company.team_support if company else "") or "",
        "monthly_budget_range": j.monthly_budget_range or (company.monthly_budget_range if company else "") or "",
        "decision_authority": j.decision_authority or (company.decision_authority if company else "") or "",
        "success_horizon": j.success_horizon or (company.success_horizon if company else "") or ""
    }
    applicant_count = db.query(models.Application).filter(models.Application.job_id == j.id).count()

    return {
        "id": j.id,
        "share_code": encode_job_id(j.id),
        "title": j.title,
        "description": j.description,
        "skills": j.skills or [],
        "experience_level": j.experience_level or j.ownership_level,
        "ownership_level": j.ownership_level,
        "specialization": j.specialization,
        "must_have_capabilities": j.must_have_capabilities,
        "preferred_capabilities": j.preferred_capabilities,
        "availability_requirement": j.availability_requirement,
        "min_experience": j.min_experience,
        "salary_min": j.salary_min,
        "salary_max": j.salary_max,
        "salary_currency": j.salary_currency,
        "location": j.location,
        "work_mode": j.work_mode,
        "job_type": j.job_type,
        "status": j.status,
        "group_id": j.group_id,
        "group_name": j.group.name if j.group else None,
        "screening_questions": j.screening_questions or [],
        "interview_rounds": j.interview_rounds or [],
        "applicant_count": applicant_count,
        "created_at": j.created_at.isoformat() if j.created_at else None,
        "business_context": b_context,
        "hiring_need": h_need,
        "company": {
            "id": company.id if company else None,
            "company_name": company.company_name if company else "Digital Agency",
            "logo_url": company.logo_url if company else None,
            "is_verified": company.is_verified if company else False,
            "website": company.website if company else "",
            "industry": company.industry if company else "Digital Marketing",
            "about": company.about if company else "",
            "location": company.location if company else "",
            "product_service": company.product_service if company else "",
            "business_model": company.business_model if company else "",
            "growth_stage": company.growth_stage if company else "",
            "target_audience": company.target_audience if company else "",
            "ideal_customer_profile": company.ideal_customer_profile if company else "",
            "business_problem": company.business_problem if company else "",
            "expected_outcome": company.expected_outcome if company else "",
            "team_support": company.team_support if company else "",
            "monthly_budget_range": company.monthly_budget_range if company else "",
            "decision_authority": company.decision_authority if company else "",
            "success_horizon": company.success_horizon if company else ""
        }
    }

