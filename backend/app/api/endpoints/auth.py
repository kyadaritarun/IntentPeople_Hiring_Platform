from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core import security
from app.core.email import send_otp_email
from app.api.deps import get_current_user, get_user_company

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
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        email=data.email,
        password_hash=security.hash_password(data.password),
        role="CANDIDATE",
        is_verified=False
    )
    db.add(user)
    db.flush()

    candidate = models.Candidate(
        user_id=user.id,
        full_name=data.full_name,
        phone=data.phone,
        place=data.place or data.city,
        city=data.city,
        state=data.state,
        title="Candidate",
        summary=f"Candidate based in {data.city}, {data.state}."
    )
    db.add(candidate)

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
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        email=data.email,
        password_hash=security.hash_password(data.password),
        role="ADMIN",
        is_verified=False
    )
    db.add(user)
    db.flush()

    company = models.Company(
        user_id=user.id,
        company_name=data.company_name,
        business_email=data.email,
        phone=data.phone,
        website=data.website,
        industry=data.industry,
        location=data.location or "Global / Remote",
        about=data.company_details,
        is_verified=False,
        verification_status="PENDING"
    )
    db.add(company)

    otp_code = security.generate_otp()
    otp_entry = models.OTPVerification(
        user_id=user.id,
        email=data.email,
        otp_code=otp_code
    )
    db.add(otp_entry)
    db.commit()

    # Dispatch email in background
    background_tasks.add_task(send_otp_email, to_email=data.email, otp_code=otp_code, user_name=data.company_name)

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
            user_name = company.company_name

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

    token = security.create_access_token({"sub": str(user.id), "role": user.role})

    profile_data = {}
    if user.role == "CANDIDATE":
        candidate = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(candidate)
    else:
        comp = get_user_company(user, db)
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        if comp:
            profile_data = {
                "id": comp.id,
                "company_name": comp.company_name,
                "full_name": member.name if member else comp.company_name,
                "title": member.title if member else ("Administrator" if user.role == "ADMIN" else "Staff"),
                "is_verified": comp.is_verified,
                "verification_status": comp.verification_status
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

@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not security.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = security.create_access_token({"sub": str(user.id), "role": user.role})

    profile_data = {}
    if user.role == "CANDIDATE":
        c = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(c)
    else:
        comp = get_user_company(user, db)
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        if comp:
            profile_data = {
                "id": comp.id, 
                "company_name": comp.company_name,
                "full_name": member.name if member else comp.company_name,
                "title": member.title if member else ("Administrator" if user.role == "ADMIN" else "Staff"),
                "website": comp.website,
                "avatar_url": member.avatar_url if member else comp.logo_url,
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

@router.get("/me")
def get_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if user.role == "CANDIDATE":
        c = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        profile_data = format_candidate_profile(c)
    else:
        comp = get_user_company(user, db)
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first() if user.role in ["RECRUITER", "HIRING_MANAGER"] else None
        
        staff_phone = (member.phone if (member and member.phone) else (comp.phone if comp else ""))
        staff_place = (member.place if (member and member.place) else (comp.location if comp else ""))
        staff_name = member.name if member else (comp.company_name if comp else user.email.split("@")[0].title())
        staff_title = member.title if member else ("Administrator" if user.role == "ADMIN" else ("Technical Recruiter" if user.role == "RECRUITER" else "Hiring Manager"))

        if comp:
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
                "location": comp.location,
                "website": comp.website,
                "industry": comp.industry,
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
                "verification_status": comp.verification_status
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
