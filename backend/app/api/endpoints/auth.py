from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core import security
from app.core.email import send_otp_email, send_password_reset_email
from app.api.deps import get_current_user, get_user_company
from app.api.endpoints.payment import get_plan_config, DEFAULT_SIDEBAR_ACCESS

router = APIRouter(prefix="/auth", tags=["Auth"])

def format_candidate_profile(c: models.Candidate) -> dict:
    if not c:
        return {}
    return {
        "id": c.id,
        "full_name": c.full_name or "",
        "title": c.title or "",
        "phone": c.phone or "",
        "place": c.place or "",
        "city": c.city or "",
        "state": c.state or "",
        "summary": c.summary or "",
        "skills": c.skills or [],
        "expertise": getattr(c, "expertise", []) or [],
        "experience": c.experience or [],
        "education": c.education or [],
        "certifications": getattr(c, "certifications", []) or [],
        "hiring_preferences": getattr(c, "hiring_preferences", {}) or {},
        "resume_url": c.resume_url,
        "resume_filename": c.resume_filename,
        "avatar_url": c.avatar_url,
        "cover_url": c.cover_url,
        "portfolio_url": c.portfolio_url,
        "linkedin_url": getattr(c, "linkedin_url", None) or "",
        "views_count": getattr(c, "views_count", 0) or 0,
        "top_search_count": getattr(c, "top_search_count", 0) or 0
    }

@router.post("/register/candidate", status_code=201)
def register_candidate(
    data: schemas.CandidateRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        # Allow re-registration for unverified accounts
        user = existing
        user.password_hash = security.hash_password(data.password)
        user.role = "CANDIDATE"
        user.is_verified = False
        db.flush()

        # Remove conflicting unverified company record if previously registered as company
        db.query(models.Company).filter(models.Company.user_id == user.id).delete()
    else:
        user = models.User(
            email=data.email,
            password_hash=security.hash_password(data.password),
            role="CANDIDATE",
            is_verified=False
        )
        db.add(user)
        db.flush()

    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if candidate:
        candidate.full_name = data.full_name
        candidate.phone = data.phone
        candidate.place = data.place or data.city
        candidate.city = data.city
        candidate.state = data.state
        candidate.linkedin_url = data.linkedin_url
        candidate.title = "Candidate"
        candidate.summary = f"Candidate based in {data.city}, {data.state}."
    else:
        candidate = models.Candidate(
            user_id=user.id,
            full_name=data.full_name,
            phone=data.phone,
            place=data.place or data.city,
            city=data.city,
            state=data.state,
            linkedin_url=data.linkedin_url,
            title="Candidate",
            summary=f"Candidate based in {data.city}, {data.state}."
        )
        db.add(candidate)

    # Invalidate previous OTP entries and issue a new one
    db.query(models.OTPVerification).filter(models.OTPVerification.user_id == user.id).delete()

    otp_code = security.generate_otp()
    otp_entry = models.OTPVerification(
        user_id=user.id,
        email=data.email,
        otp_code=otp_code
    )
    db.add(otp_entry)
    db.commit()

    # Dispatch email in background
    background_tasks.add_task(send_otp_email, to_email=data.email, otp_code=otp_code, user_name=data.full_name)

    return {
        "message": "Candidate registered successfully. Please verify your email with the OTP code sent to your inbox.",
        "email": data.email,
        "role": "CANDIDATE"
    }

@router.post("/register/company", status_code=201)
def register_company(
    data: schemas.CompanyRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        # Allow re-registration for unverified accounts
        user = existing
        user.password_hash = security.hash_password(data.password)
        user.role = "ADMIN"
        user.is_verified = False
        db.flush()

        # Remove conflicting unverified candidate record if previously registered as candidate
        db.query(models.Candidate).filter(models.Candidate.user_id == user.id).delete()
    else:
        user = models.User(
            email=data.email,
            password_hash=security.hash_password(data.password),
            role="ADMIN",
            is_verified=False
        )
        db.add(user)
        db.flush()

    company = db.query(models.Company).filter(models.Company.user_id == user.id).first()
    if company:
        company.company_name = data.company_name
        company.business_email = data.email
        company.phone = data.phone
        company.website = data.website
        company.industry = data.industry
        company.location = data.location or "Global / Remote"
        company.headquarters_location = data.location or "Global / Remote"
        company.company_size = data.company_size
        company.contact_person = data.full_name
        company.about = data.company_details or ""
        company.is_verified = False
        company.verification_status = "PENDING"
        company.plan_type = "NONE"
        company.plan_status = "PENDING"
    else:
        company = models.Company(
            user_id=user.id,
            company_name=data.company_name,
            business_email=data.email,
            phone=data.phone,
            website=data.website,
            industry=data.industry,
            location=data.location or "Global / Remote",
            headquarters_location=data.location or "Global / Remote",
            company_size=data.company_size,
            contact_person=data.full_name,
            about=data.company_details or "",
            is_verified=False,
            verification_status="PENDING",
            plan_type="NONE",
            plan_status="PENDING"
        )
        db.add(company)

    # Invalidate previous OTP entries and issue a new one
    db.query(models.OTPVerification).filter(models.OTPVerification.user_id == user.id).delete()

    otp_code = security.generate_otp()
    otp_entry = models.OTPVerification(
        user_id=user.id,
        email=data.email,
        otp_code=otp_code
    )
    db.add(otp_entry)
    db.commit()

    # Dispatch email in background
    background_tasks.add_task(send_otp_email, to_email=data.email, otp_code=otp_code, user_name=data.full_name or data.company_name)

    return {
        "message": "Administrator account registered successfully. Please enter the OTP sent to your business email.",
        "email": data.email,
        "role": "ADMIN"
    }

@router.post("/resend-otp")
def resend_otp(
    data: schemas.ResendOTP,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email address")

    otp_code = security.generate_otp()
    otp_entry = models.OTPVerification(
        user_id=user.id,
        email=data.email,
        otp_code=otp_code
    )
    db.add(otp_entry)
    db.commit()

    user_name = ""
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if candidate:
        user_name = candidate.full_name
    else:
        company = db.query(models.Company).filter(models.Company.user_id == user.id).first()
        if company:
            user_name = getattr(company, "contact_person", None) or company.company_name

    background_tasks.add_task(send_otp_email, to_email=data.email, otp_code=otp_code, user_name=user_name)

    return {
        "message": f"A new 6-digit verification OTP has been sent to {data.email}.",
        "email": data.email
    }

@router.post("/verify-otp")
def verify_otp(data: schemas.OTPVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    otp_record = db.query(models.OTPVerification)\
        .filter(models.OTPVerification.user_id == user.id, models.OTPVerification.is_used == False)\
        .order_by(models.OTPVerification.id.desc())\
        .first()

    if not otp_record or otp_record.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP verification code. Please try again.")

    otp_record.is_used = True
    user.is_verified = True
    db.commit()

    if user.role in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        comp = get_user_company(user, db)
        if comp:
            is_deactivated = (
                (hasattr(comp, "is_active") and comp.is_active is False)
                or comp.plan_status in ["DEACTIVATED", "SUSPENDED", "INACTIVE"]
            )
            if is_deactivated:
                raise HTTPException(
                    status_code=403,
                    detail="Your organization account has been deactivated by the intentpeople Administrator. Access is suspended. Please contact support."
                )

    token = security.create_access_token({"sub": str(user.id), "role": user.role})

    profile_data = {}
    if user.role == "CANDIDATE":
        candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(candidate)
    else:
        comp = get_user_company(user, db)
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        if comp:
            cfg = get_plan_config(comp.plan_type or "FREE", db)
            plan_max_roles = cfg.get("max_roles", 1)
            plan_max_jobs = cfg.get("max_jobs", 1)
            plan_max_cands = cfg.get("max_candidates_per_job", 999999)

            effective_max_roles = comp.max_roles if comp.max_roles is not None else plan_max_roles
            effective_max_jobs = comp.max_jobs if comp.max_jobs is not None else plan_max_jobs
            effective_max_cands = comp.max_candidates_per_job if comp.max_candidates_per_job is not None else plan_max_cands

            profile_data = {
                "id": comp.id,
                "company_name": comp.company_name,
                "full_name": member.name if member else (getattr(comp, "contact_person", None) or comp.company_name),
                "title": member.title if member else ("Administrator" if user.role == "ADMIN" else "Staff"),
                "is_verified": comp.is_verified,
                "verification_status": comp.verification_status,
                "plan_type": comp.plan_type or "FREE",
                "plan_status": comp.plan_status or "ACTIVE",
                "plan_expires_at": comp.plan_expires_at.isoformat() if comp.plan_expires_at else None,
                "max_roles": effective_max_roles,
                "max_jobs": effective_max_jobs,
                "max_candidates_per_job": effective_max_cands,
                "location": comp.location or "",
                "headquarters_location": getattr(comp, "headquarters_location", None) or comp.location or "",
                "company_size": getattr(comp, "company_size", None) or "",
                "contact_person": getattr(comp, "contact_person", None) or ""
            }

    return {
        "message": "Email verified successfully!",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "profile": profile_data
        }
    }

@router.post("/forgot-password")
def forgot_password(
    data: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email address")

    # Invalidate any prior unused OTPs for this user
    db.query(models.OTPVerification).filter(models.OTPVerification.user_id == user.id).delete()

    otp_code = security.generate_otp()
    otp_entry = models.OTPVerification(
        user_id=user.id,
        email=data.email,
        otp_code=otp_code
    )
    db.add(otp_entry)
    db.commit()

    user_name = ""
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    if candidate:
        user_name = candidate.full_name
    else:
        company = db.query(models.Company).filter(models.Company.user_id == user.id).first()
        if company:
            user_name = company.company_name

    background_tasks.add_task(send_password_reset_email, to_email=data.email, otp_code=otp_code, user_name=user_name)

    return {
        "message": f"A 6-digit password reset code has been sent to {data.email}.",
        "email": data.email
    }

@router.post("/reset-password")
def reset_password(
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    otp_record = db.query(models.OTPVerification)\
        .filter(models.OTPVerification.user_id == user.id, models.OTPVerification.is_used == False)\
        .order_by(models.OTPVerification.id.desc())\
        .first()

    if not otp_record or otp_record.otp_code != data.otp_code.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired reset code. Please check your email and try again.")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    otp_record.is_used = True
    user.password_hash = security.hash_password(data.new_password)
    user.is_verified = True
    db.commit()

    return {
        "message": "Password reset successfully! You can now log in with your new password.",
        "email": data.email
    }

@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not security.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Your account has not been verified yet. Please enter the OTP sent to your email or register again."
        )

    # Check if user's organization has been deactivated
    if user.role in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        comp = get_user_company(user, db)
        if comp:
            is_deactivated = (
                (hasattr(comp, "is_active") and comp.is_active is False)
                or comp.plan_status in ["DEACTIVATED", "SUSPENDED", "INACTIVE"]
            )
            if is_deactivated:
                raise HTTPException(
                    status_code=403,
                    detail="Your organization account has been deactivated by the intentpeople Administrator. Access is suspended. Please contact support."
                )

    token = security.create_access_token({"sub": str(user.id), "role": user.role})

    profile_data = {}
    if user.role == "CANDIDATE":
        c = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(c)
    elif user.role == "SUPERADMIN":
        profile_data = {
            "id": user.id,
            "full_name": "Super Administrator",
            "name": "Super Administrator",
            "email": user.email,
            "role": "SUPERADMIN",
            "title": "Master Platform Controller",
            "is_verified": True
        }
    else:
        comp = get_user_company(user, db)
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        if comp:
            cfg = get_plan_config(comp.plan_type or "FREE", db)
            plan_max_roles = cfg.get("max_roles", 1)
            plan_max_jobs = cfg.get("max_jobs", 1)
            plan_max_cands = cfg.get("max_candidates_per_job", 999999)

            effective_max_roles = comp.max_roles if comp.max_roles is not None else plan_max_roles
            effective_max_jobs = comp.max_jobs if comp.max_jobs is not None else plan_max_jobs
            effective_max_cands = comp.max_candidates_per_job if comp.max_candidates_per_job is not None else plan_max_cands

            profile_data = {
                "id": comp.id, 
                "company_name": comp.company_name,
                "full_name": member.name if member else (getattr(comp, "contact_person", None) or comp.company_name),
                "title": member.title if member else ("Administrator" if user.role == "ADMIN" else "Staff"),
                "website": comp.website,
                "location": comp.location or "",
                "headquarters_location": getattr(comp, "headquarters_location", None) or comp.location or "",
                "company_size": getattr(comp, "company_size", None) or "",
                "contact_person": getattr(comp, "contact_person", None) or "",
                "avatar_url": member.avatar_url if member else comp.logo_url,
                "is_verified": comp.is_verified,
                "verification_status": comp.verification_status,
                "plan_type": comp.plan_type or "FREE",
                "plan_status": comp.plan_status or "ACTIVE",
                "plan_expires_at": comp.plan_expires_at.isoformat() if comp.plan_expires_at else None,
                "max_roles": effective_max_roles,
                "max_jobs": effective_max_jobs,
                "max_candidates_per_job": effective_max_cands,
                "sidebar_access": comp.sidebar_access if comp.sidebar_access else cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(comp.plan_type or "FREE", {})
            }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "profile": profile_data
        }
    }

@router.get("/me")
def get_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if user.role == "CANDIDATE":
        c = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(c)
    elif user.role == "SUPERADMIN":
        profile_data = {
            "id": user.id,
            "full_name": "Super Administrator",
            "name": "Super Administrator",
            "email": user.email,
            "role": "SUPERADMIN",
            "title": "Master Platform Controller",
            "is_verified": True
        }
    else:
        comp = get_user_company(user, db)
        if comp:
            is_deactivated = (
                (hasattr(comp, "is_active") and comp.is_active is False)
                or comp.plan_status in ["DEACTIVATED", "SUSPENDED", "INACTIVE"]
            )
            if is_deactivated:
                raise HTTPException(
                    status_code=403,
                    detail="Your organization account has been deactivated by the Super Administrator. Access is suspended."
                )

        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        
        staff_phone = (member.phone if (member and member.phone) else (comp.phone if comp else ""))
        staff_place = (member.place if (member and member.place) else (comp.location if comp else ""))
        staff_name = member.name if member else ((getattr(comp, "contact_person", None) or comp.company_name) if comp else user.email.split("@")[0].title())
        staff_title = member.title if member else ("Administrator" if user.role == "ADMIN" else ("Technical Recruiter" if user.role == "RECRUITER" else "Hiring Manager"))

        if comp:
            cfg = get_plan_config(comp.plan_type or "FREE", db)
            plan_max_roles = cfg.get("max_roles", 1)
            plan_max_jobs = cfg.get("max_jobs", 1)
            plan_max_cands = cfg.get("max_candidates_per_job", 999999)

            effective_max_roles = comp.max_roles if comp.max_roles is not None else plan_max_roles
            effective_max_jobs = comp.max_jobs if comp.max_jobs is not None else plan_max_jobs
            effective_max_cands = comp.max_candidates_per_job if comp.max_candidates_per_job is not None else plan_max_cands

            profile_data = {
                "id": comp.id,
                "company_name": comp.company_name,
                "full_name": staff_name,
                "name": staff_name,
                "email": user.email,
                "role": user.role,
                "title": staff_title,
                "phone": staff_phone,
                "place": staff_place,
                "contact_person": getattr(comp, "contact_person", None) or "",
                "location": comp.location,
                "headquarters_location": getattr(comp, "headquarters_location", None) or comp.location or "",
                "other_locations": getattr(comp, "other_locations", None) or "",
                "website": comp.website,
                "linkedin_url": getattr(comp, "linkedin_url", None) or "",
                "industry": comp.industry,
                "primary_industry": getattr(comp, "primary_industry", None) or comp.industry or "",
                "sub_industry": getattr(comp, "sub_industry", None) or "",
                "organisation_type": getattr(comp, "organisation_type", None) or "",
                "company_size": getattr(comp, "company_size", None) or "",
                "year_founded": getattr(comp, "year_founded", None) or "",
                "about": comp.about,
                "logo_url": comp.logo_url,
                "avatar_url": member.avatar_url if member else comp.logo_url,
                "product_service": comp.product_service,
                "business_model": comp.business_model,
                "growth_stage": comp.growth_stage,
                "target_audience": comp.target_audience,
                "ideal_customer_profile": comp.ideal_customer_profile,
                "business_problem": comp.business_problem,
                "expected_outcome": comp.expected_outcome,
                "team_support": comp.team_support,
                "monthly_budget_range": comp.monthly_budget_range,
                "decision_authority": comp.decision_authority,
                "success_horizon": comp.success_horizon,
                "is_verified": comp.is_verified,
                "verification_status": comp.verification_status,
                "plan_type": comp.plan_type or "FREE",
                "plan_status": comp.plan_status or "ACTIVE",
                "plan_expires_at": comp.plan_expires_at.isoformat() if comp.plan_expires_at else None,
                "max_roles": effective_max_roles,
                "max_jobs": effective_max_jobs,
                "max_candidates_per_job": effective_max_cands,
                "sidebar_access": comp.sidebar_access if comp.sidebar_access else cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(comp.plan_type or "FREE", {})
            }
        else:
            profile_data = {
                "full_name": staff_name,
                "name": staff_name,
                "email": user.email,
                "role": user.role,
                "title": staff_title,
                "phone": staff_phone,
                "place": staff_place,
                "avatar_url": member.avatar_url if member else None
            }

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified,
        "profile": profile_data
    }

@router.post("/google")
def google_login(data: schemas.GoogleOAuthLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        user = models.User(
            email=data.email,
            password_hash=security.hash_password(f"oauth_google_{data.email}"),
            role=data.role if data.role in ["CANDIDATE", "RECRUITER"] else "CANDIDATE",
            is_verified=True
        )
        db.add(user)
        db.flush()

        if user.role == "CANDIDATE":
            candidate = models.Candidate(
                user_id=user.id,
                full_name=data.name or data.email.split("@")[0].replace(".", " ").title(),
                title="Candidate",
                city="Remote",
                state="Global",
                summary="Candidate authenticated via Google."
            )
            db.add(candidate)
        else:
            company = models.Company(
                user_id=user.id,
                company_name=data.name or f"{data.email.split('@')[0].title()} Agency",
                business_email=data.email,
                is_verified=True,
                verification_status="VERIFIED"
            )
            db.add(company)
        db.commit()
    else:
        if not user.is_verified:
            user.is_verified = True
            db.commit()

    token = security.create_access_token({"sub": str(user.id), "role": user.role})

    profile_data = {}
    if user.role == "CANDIDATE":
        c = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(c)
    else:
        comp = db.query(models.Company).filter(models.Company.user_id == user.id).first()
        if comp:
            profile_data = {
                "id": comp.id,
                "company_name": comp.company_name,
                "website": comp.website,
                "is_verified": comp.is_verified,
                "verification_status": comp.verification_status
            }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "profile": profile_data
        }
    }
