import time
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.database import get_db, schema_name
from app.config import settings
from app import models
from app.core import security
from app.api.deps import get_current_superadmin
from app.api.endpoints.payment import PLAN_CONFIGS, DEFAULT_SIDEBAR_ACCESS

router = APIRouter(prefix="/superadmin", tags=["Superadmin Master Management"])


# ==========================================
# Pydantic Schemas
# ==========================================

class SuperadminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateCompanyPlanRequest(BaseModel):
    plan_type: Optional[str] = None          # FREE, PLAN_4999, PLAN_14999
    plan_status: Optional[str] = None        # ACTIVE, PENDING, EXPIRED, CANCELLED
    extend_days: Optional[int] = None        # e.g. 30, 45, 90 days to add
    max_roles: Optional[int] = None
    max_jobs: Optional[int] = None
    max_candidates_per_job: Optional[int] = None
    sidebar_access: Optional[dict] = None
    notes: Optional[str] = None

class ToggleCompanyVerificationRequest(BaseModel):
    is_verified: bool
    verification_status: Optional[str] = None  # VERIFIED, PENDING, REJECTED

class RejectCompanyVerificationRequest(BaseModel):
    reason: Optional[str] = None

class ToggleCompanyStatusRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None

class ToggleCandidateVerificationRequest(BaseModel):
    is_verified: bool

class UpdatePlanConfigRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    price_display: Optional[str] = None
    billing: Optional[str] = None
    duration_days: Optional[int] = None
    max_roles: Optional[int] = None
    max_jobs: Optional[int] = None
    max_candidates_per_job: Optional[int] = None
    badge: Optional[str] = None
    is_popular: Optional[bool] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    sidebar_access: Optional[dict] = None


# ==========================================
# Authentication & Seed Endpoints
# ==========================================

@router.post("/login")
def superadmin_login(data: SuperadminLoginRequest, db: Session = Depends(get_db)):
    """Dedicated Superadmin authentication endpoint."""
    input_email = data.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == input_email).first()
    if not user or not security.verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid superadmin credentials. Please verify your email and password."
        )

    if user.role != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This login portal is strictly reserved for Super Administrators."
        )

    token = security.create_access_token({"sub": str(user.id), "role": "SUPERADMIN"})

    return {
        "message": "Superadmin authenticated successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": "SUPERADMIN",
            "is_verified": True,
            "profile": {
                "id": user.id,
                "full_name": "Super Administrator",
                "name": "Super Administrator",
                "email": user.email,
                "role": "SUPERADMIN",
                "title": "Master Platform Controller",
                "is_verified": True
            }
        }
    }


@router.post("/seed")
def seed_superadmin(db: Session = Depends(get_db)):
    """Safe idempotent helper to seed or reset the default superadmin account using .env credentials."""
    superadmin_email = (getattr(settings, "SUPERADMIN_EMAIL", None) or "superadmin@intentpeople.com").strip().lower()
    superadmin_pass = getattr(settings, "SUPERADMIN_PASSWORD", None) or "SuperAdmin@IntentPeople2026!"
    pass_hash = security.hash_password(superadmin_pass)

    user = db.query(models.User).filter(func.lower(models.User.email) == superadmin_email).first()
    if not user:
        user = models.User(
            email=superadmin_email,
            password_hash=pass_hash,
            role="SUPERADMIN",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created = True
    else:
        user.role = "SUPERADMIN"
        user.password_hash = pass_hash
        user.is_verified = True
        db.commit()
        created = False

    return {
        "success": True,
        "created": created,
        "email": superadmin_email,
        "role": "SUPERADMIN",
        "message": "Superadmin account verified and active."
    }


# ==========================================
# Metrics & Analytics Dashboard
# ==========================================

@router.get("/stats")
def get_superadmin_stats(
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Aggregated system metrics: Revenue, subscriptions, users, and audit figures."""
    total_companies = db.query(models.Company).count()
    total_candidates = db.query(models.Candidate).count()
    total_members = db.query(models.CompanyMember).count()
    total_jobs = db.query(models.Job).count()
    total_applications = db.query(models.Application).count()

    # Total Revenue from successful payment transactions
    revenue_result = db.query(func.sum(models.PaymentTransaction.amount))\
        .filter(models.PaymentTransaction.status == "SUCCESS")\
        .scalar()
    total_revenue = int(revenue_result or 0)

    # Breakdown by plan_type
    free_companies = db.query(models.Company).filter(
        or_(models.Company.plan_type == "FREE", models.Company.plan_type.is_(None))
    ).count()

    plan_4999_companies = db.query(models.Company).filter(
        models.Company.plan_type == "PLAN_4999"
    ).count()

    plan_14999_companies = db.query(models.Company).filter(
        models.Company.plan_type == "PLAN_14999"
    ).count()

    # Breakdown by plan_status
    active_plans = db.query(models.Company).filter(models.Company.plan_status == "ACTIVE").count()
    expired_plans = db.query(models.Company).filter(models.Company.plan_status == "EXPIRED").count()
    pending_plans = db.query(models.Company).filter(models.Company.plan_status == "PENDING").count()

    # Recent 5 transactions
    recent_transactions_raw = db.query(models.PaymentTransaction)\
        .order_by(desc(models.PaymentTransaction.created_at))\
        .limit(5)\
        .all()

    recent_transactions = []
    for tx in recent_transactions_raw:
        comp = db.query(models.Company).filter(models.Company.id == tx.company_id).first()
        recent_transactions.append({
            "id": tx.id,
            "company_id": tx.company_id,
            "company_name": comp.company_name if comp else f"Company #{tx.company_id}",
            "plan_id": tx.plan_id,
            "amount": tx.amount,
            "currency": tx.currency or "INR",
            "razorpay_order_id": tx.razorpay_order_id,
            "razorpay_payment_id": tx.razorpay_payment_id,
            "status": tx.status,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })

    # Recent 5 companies
    recent_companies_raw = db.query(models.Company)\
        .order_by(desc(models.Company.created_at))\
        .limit(5)\
        .all()

    recent_companies = [{
        "id": c.id,
        "company_name": c.company_name,
        "business_email": c.business_email,
        "plan_type": c.plan_type or "FREE",
        "plan_status": c.plan_status or "ACTIVE",
        "is_verified": c.is_verified,
        "created_at": c.created_at.isoformat() if c.created_at else None
    } for c in recent_companies_raw]

    # Recent 5 candidates
    recent_candidates_raw = db.query(models.Candidate)\
        .order_by(desc(models.Candidate.created_at))\
        .limit(5)\
        .all()

    recent_candidates = []
    for cd in recent_candidates_raw:
        u = db.query(models.User).filter(models.User.id == cd.user_id).first()
        recent_candidates.append({
            "id": cd.id,
            "full_name": cd.full_name,
            "email": u.email if u else "",
            "title": cd.title or "Candidate",
            "city": cd.city or cd.place or "",
            "created_at": cd.created_at.isoformat() if cd.created_at else None
        })

    return {
        "metrics": {
            "total_revenue": total_revenue,
            "total_companies": total_companies,
            "total_candidates": total_candidates,
            "total_recruiters": total_members + total_companies, # admins + staff members
            "total_jobs": total_jobs,
            "total_applications": total_applications,
            "active_subscriptions": active_plans
        },
        "plans_breakdown": {
            "FREE": free_companies,
            "PLAN_4999": plan_4999_companies,
            "PLAN_14999": plan_14999_companies
        },
        "status_breakdown": {
            "ACTIVE": active_plans,
            "EXPIRED": expired_plans,
            "PENDING": pending_plans
        },
        "recent_transactions": recent_transactions,
        "recent_companies": recent_companies,
        "recent_candidates": recent_candidates
    }


# ==========================================
# Plan Template Configuration Management
# ==========================================

@router.get("/plans")
def list_plan_configs(
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Retrieve all available subscription plan templates with full metadata."""
    plans = db.query(models.PlanConfig).all()
    order = {"FREE": 0, "PLAN_4999": 1, "PLAN_14999": 2}
    sorted_plans = sorted(plans, key=lambda x: order.get(x.id, 99))
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "price_display": p.price_display,
            "billing": p.billing,
            "duration_days": p.duration_days,
            "max_roles": p.max_roles,
            "max_jobs": p.max_jobs,
            "max_candidates_per_job": p.max_candidates_per_job,
            "badge": p.badge or "",
            "is_popular": p.is_popular,
            "description": p.description or "",
            "features": p.features or [],
            "sidebar_access": p.sidebar_access if p.sidebar_access else DEFAULT_SIDEBAR_ACCESS.get(p.id, {}),
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        }
        for p in sorted_plans
    ]

@router.put("/plans/{plan_id}")
def update_plan_config(
    plan_id: str,
    data: UpdatePlanConfigRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Update plan template configurations (price, duration, limits, features, badge, sidebar_access, etc.)."""
    plan = db.query(models.PlanConfig).filter(models.PlanConfig.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan configuration not found")

    if data.name is not None:
        plan.name = data.name
    if data.price is not None:
        plan.price = data.price
        if not data.price_display:
            plan.price_display = f"₹{data.price:,}"
    if data.price_display is not None:
        plan.price_display = data.price_display
    if data.billing is not None:
        plan.billing = data.billing
    if data.duration_days is not None:
        plan.duration_days = data.duration_days
    if data.max_roles is not None:
        plan.max_roles = data.max_roles
    if data.max_jobs is not None:
        plan.max_jobs = data.max_jobs
    if data.max_candidates_per_job is not None:
        plan.max_candidates_per_job = data.max_candidates_per_job
    if data.badge is not None:
        plan.badge = data.badge
    if data.is_popular is not None:
        plan.is_popular = data.is_popular
    if data.description is not None:
        plan.description = data.description
    if data.features is not None:
        plan.features = data.features
    if data.sidebar_access is not None:
        plan.sidebar_access = data.sidebar_access

    plan.updated_at = datetime.utcnow()

    # Cascade updated limits to existing companies on this plan
    companies = db.query(models.Company).filter(models.Company.plan_type == plan_id).all()
    for comp in companies:
        if data.max_roles is not None:
            comp.max_roles = data.max_roles
        if data.max_jobs is not None:
            comp.max_jobs = data.max_jobs
        if data.max_candidates_per_job is not None:
            comp.max_candidates_per_job = data.max_candidates_per_job
        if data.sidebar_access is not None:
            comp.sidebar_access = data.sidebar_access

    db.commit()
    db.refresh(plan)

    # Also update in-memory PLAN_CONFIGS
    if plan_id in PLAN_CONFIGS:
        PLAN_CONFIGS[plan_id].update({
            "name": plan.name,
            "price": plan.price,
            "price_display": plan.price_display,
            "billing": plan.billing,
            "duration_days": plan.duration_days,
            "max_roles": plan.max_roles,
            "max_jobs": plan.max_jobs,
            "max_candidates_per_job": plan.max_candidates_per_job,
            "badge": plan.badge,
            "is_popular": plan.is_popular,
            "description": plan.description,
            "features": plan.features,
            "sidebar_access": plan.sidebar_access if plan.sidebar_access else DEFAULT_SIDEBAR_ACCESS.get(plan_id, {})
        })

    return {
        "message": f"Plan '{plan.name}' updated successfully.",
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "price": plan.price,
            "price_display": plan.price_display,
            "billing": plan.billing,
            "duration_days": plan.duration_days,
            "max_roles": plan.max_roles,
            "max_jobs": plan.max_jobs,
            "max_candidates_per_job": plan.max_candidates_per_job,
            "badge": plan.badge,
            "is_popular": plan.is_popular,
            "description": plan.description,
            "features": plan.features,
            "sidebar_access": plan.sidebar_access if plan.sidebar_access else DEFAULT_SIDEBAR_ACCESS.get(plan.id, {}),
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None
        }
    }


# ==========================================
# Company & Subscription Management
# ==========================================

@router.get("/companies")
def list_companies(
    q: Optional[str] = Query(None, description="Search company name, email, industry, or location"),
    plan_type: Optional[str] = Query(None, description="Filter by plan_type: FREE, PLAN_4999, PLAN_14999"),
    plan_status: Optional[str] = Query(None, description="Filter by plan_status: ACTIVE, EXPIRED, PENDING, CANCELLED"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Retrieve all registered companies with subscription status, staff count, and jobs count."""
    query = db.query(models.Company)

    if q and isinstance(q, str) and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Company.company_name.ilike(search_pattern),
                models.Company.business_email.ilike(search_pattern),
                models.Company.industry.ilike(search_pattern),
                models.Company.location.ilike(search_pattern)
            )
        )

    if plan_type and isinstance(plan_type, str) and plan_type.strip():
        query = query.filter(models.Company.plan_type == plan_type)

    if plan_status and isinstance(plan_status, str) and plan_status.strip():
        query = query.filter(models.Company.plan_status == plan_status)

    companies = query.order_by(desc(models.Company.created_at)).all()

    result = []
    for c in companies:
        members_count = db.query(models.CompanyMember).filter(models.CompanyMember.company_id == c.id).count()
        jobs_count = db.query(models.Job).filter(models.Job.company_id == c.id).count()
        members = db.query(models.CompanyMember).filter(models.CompanyMember.company_id == c.id).all()

        members_list = []
        for m in members:
            u = db.query(models.User).filter(models.User.id == m.user_id).first()
            members_list.append({
                "id": m.id,
                "name": m.name,
                "role": m.role,
                "title": m.title,
                "phone": m.phone,
                "email": u.email if u else ""
            })

        # Calculate days remaining
        days_remaining = None
        if c.plan_expires_at:
            delta = c.plan_expires_at - datetime.utcnow()
            days_remaining = max(0, delta.days)

        plan_cfg = PLAN_CONFIGS.get(c.plan_type or "FREE", PLAN_CONFIGS["FREE"])

        result.append({
            "id": c.id,
            "company_name": c.company_name,
            "business_email": c.business_email,
            "phone": c.phone,
            "website": c.website,
            "industry": c.industry,
            "location": c.location,
            "logo_url": c.logo_url,
            "is_verified": c.is_verified,
            "verification_status": c.verification_status or "PENDING",
            "verification_requested_at": c.verification_requested_at.isoformat() if getattr(c, "verification_requested_at", None) else None,
            "verification_reviewed_at": c.verification_reviewed_at.isoformat() if getattr(c, "verification_reviewed_at", None) else None,
            "verification_rejection_reason": getattr(c, "verification_rejection_reason", None),
            "compliance_documents_data": getattr(c, "compliance_documents_data", None) or {},
            "is_active": c.is_active if (hasattr(c, "is_active") and c.is_active is not None) else (c.plan_status != "DEACTIVATED"),
            "plan_type": c.plan_type or "FREE",
            "plan_name": plan_cfg["name"],
            "price_display": plan_cfg["price_display"],
            "plan_status": c.plan_status or "ACTIVE",
            "plan_activated_at": c.plan_activated_at.isoformat() if c.plan_activated_at else None,
            "plan_expires_at": c.plan_expires_at.isoformat() if c.plan_expires_at else None,
            "days_remaining": days_remaining,
            "max_roles": c.max_roles or plan_cfg["max_roles"],
            "max_jobs": c.max_jobs or plan_cfg["max_jobs"],
            "max_candidates_per_job": c.max_candidates_per_job or plan_cfg["max_candidates_per_job"],
            "razorpay_order_id": c.razorpay_order_id,
            "razorpay_payment_id": c.razorpay_payment_id,
            "members_count": members_count,
            "jobs_count": jobs_count,
            "members": members_list,
            "sidebar_access": c.sidebar_access if c.sidebar_access else plan_cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(c.plan_type or "FREE", {}),
            "about": c.about,
            "organisation_type": getattr(c, "organisation_type", None),
            "primary_industry": getattr(c, "primary_industry", None) or c.industry,
            "sub_industry": getattr(c, "sub_industry", None),
            "company_size": c.company_size,
            "headquarters_location": getattr(c, "headquarters_location", None) or c.location,
            "other_locations": getattr(c, "other_locations", None),
            "year_founded": getattr(c, "year_founded", None),
            "linkedin_url": getattr(c, "linkedin_url", None),
            "business_model_data": getattr(c, "business_model_data", None) or {},
            "target_audience_data": getattr(c, "target_audience_data", None) or {},
            "growth_stage_data": getattr(c, "growth_stage_data", None) or {},
            "marketing_team_data": getattr(c, "marketing_team_data", None) or {},
            "hiring_defaults_data": getattr(c, "hiring_defaults_data", None) or {},
            "product_service": getattr(c, "product_service", None),
            "business_model": getattr(c, "business_model", None),
            "growth_stage": getattr(c, "growth_stage", None),
            "target_audience": getattr(c, "target_audience", None),
            "ideal_customer_profile": getattr(c, "ideal_customer_profile", None),
            "business_problem": getattr(c, "business_problem", None),
            "expected_outcome": getattr(c, "expected_outcome", None),
            "team_support": getattr(c, "team_support", None),
            "monthly_budget_range": getattr(c, "monthly_budget_range", None),
            "decision_authority": getattr(c, "decision_authority", None),
            "success_horizon": getattr(c, "success_horizon", None),
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return result


@router.put("/companies/{company_id}/plan")
def update_company_plan(
    company_id: int,
    data: UpdateCompanyPlanRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Superadmin override for company plans:
    - Upgrade/downgrade between FREE, PLAN_4999 (Standard), and PLAN_14999 (Growth Scale).
    - Modify plan_status (ACTIVE, EXPIRED, CANCELLED, PENDING).
    - Extend validity duration (extend_days).
    - Customize limits (max_roles, max_jobs, max_candidates_per_job).
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    target_plan_type = data.plan_type or company.plan_type or "FREE"
    plan_cfg = PLAN_CONFIGS.get(target_plan_type, PLAN_CONFIGS["FREE"])

    now = datetime.utcnow()

    # Update plan type
    if data.plan_type:
        company.plan_type = data.plan_type

    # Update status
    if data.plan_status:
        company.plan_status = data.plan_status
        if data.plan_status == "DEACTIVATED":
            company.is_active = False
        elif data.plan_status == "ACTIVE":
            company.is_active = True

    # Recalculate or extend expiration
    if data.extend_days and data.extend_days > 0:
        base_date = company.plan_expires_at if (company.plan_expires_at and company.plan_expires_at > now) else now
        company.plan_expires_at = base_date + timedelta(days=data.extend_days)
        company.plan_status = "ACTIVE"
    elif data.plan_type and data.plan_type != company.plan_type:
        # If switched to a new plan without specifying extend_days, apply default plan validity
        company.plan_activated_at = now
        company.plan_expires_at = now + timedelta(days=plan_cfg["duration_days"])
        company.plan_status = "ACTIVE"

    # Set limits: use custom values if provided, else use plan defaults
    if data.max_roles is not None:
        company.max_roles = data.max_roles
    elif data.plan_type:
        company.max_roles = plan_cfg["max_roles"]

    if data.max_jobs is not None:
        company.max_jobs = data.max_jobs
    elif data.plan_type:
        company.max_jobs = plan_cfg["max_jobs"]

    if data.max_candidates_per_job is not None:
        company.max_candidates_per_job = data.max_candidates_per_job
    elif data.plan_type:
        company.max_candidates_per_job = plan_cfg["max_candidates_per_job"]

    if data.sidebar_access is not None:
        company.sidebar_access = data.sidebar_access
    elif data.plan_type and data.plan_type != company.plan_type:
        company.sidebar_access = plan_cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(data.plan_type, {})

    # Record superadmin audit transaction
    audit_tx = models.PaymentTransaction(
        company_id=company.id,
        user_id=superadmin.id,
        plan_id=company.plan_type,
        amount=plan_cfg["price"],
        currency="INR",
        razorpay_order_id="superadmin_override",
        razorpay_payment_id=f"superadmin_{int(time.time())}",
        razorpay_signature="superadmin_authorized",
        status="SUCCESS",
        created_at=now
    )
    db.add(audit_tx)
    db.commit()
    db.refresh(company)

    return {
        "message": f"Company '{company.company_name}' subscription updated to {plan_cfg['name']} ({company.plan_status}).",
        "company": {
            "id": company.id,
            "company_name": company.company_name,
            "plan_type": company.plan_type,
            "plan_status": company.plan_status,
            "is_active": company.is_active if (hasattr(company, "is_active") and company.is_active is not None) else (company.plan_status != "DEACTIVATED"),
            "plan_name": plan_cfg["name"],
            "price_display": plan_cfg["price_display"],
            "plan_activated_at": company.plan_activated_at.isoformat() if company.plan_activated_at else None,
            "plan_expires_at": company.plan_expires_at.isoformat() if company.plan_expires_at else None,
            "max_roles": company.max_roles,
            "max_jobs": company.max_jobs,
            "max_candidates_per_job": company.max_candidates_per_job,
            "sidebar_access": company.sidebar_access if company.sidebar_access else plan_cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(company.plan_type, {})
        }
    }


@router.patch("/companies/{company_id}/verification")
def toggle_company_verification(
    company_id: int,
    data: ToggleCompanyVerificationRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Toggle company verification status."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.is_verified = data.is_verified
    company.verification_status = data.verification_status or ("VERIFIED" if data.is_verified else "REJECTED")
    if data.is_verified:
        company.verification_reviewed_at = datetime.utcnow()
        company.verification_rejection_reason = None
        if not company.plan_type or company.plan_type in ["NONE", "FREE"]:
            free_cfg = PLAN_CONFIGS.get("FREE", {})
            company.plan_type = "FREE"
            company.plan_status = "ACTIVE"
            company.plan_activated_at = datetime.utcnow()
            company.plan_expires_at = datetime.utcnow() + timedelta(days=free_cfg.get("duration_days", 30))
            company.max_roles = free_cfg.get("max_roles", 1)
            company.max_jobs = free_cfg.get("max_jobs", 1)
            company.max_candidates_per_job = free_cfg.get("max_candidates_per_job", 5)
            company.sidebar_access = DEFAULT_SIDEBAR_ACCESS.get("FREE", {})

    # Also update associated user account verification
    user = db.query(models.User).filter(models.User.id == company.user_id).first()
    if user:
        user.is_verified = data.is_verified

    db.commit()
    return {
        "message": f"Company '{company.company_name}' verification updated to {company.verification_status}.",
        "company_id": company.id,
        "is_verified": company.is_verified,
        "verification_status": company.verification_status
    }


@router.get("/verification-requests")
def list_verification_requests(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter: UNDER_REVIEW, PENDING_PROFILE, REJECTED, VERIFIED, ALL"),
    q: Optional[str] = Query(None, description="Search company name, email, or industry"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Superadmin verification queue: lists companies that have requested verification or are in verification states.
    Includes full compliance documents photos (PAN, Labour, Trade, COI, Registration doc) and profile completion data.
    """
    query = db.query(models.Company)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(models.Company.verification_status == status_filter.upper())

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Company.company_name.ilike(search_pattern),
                models.Company.business_email.ilike(search_pattern),
                models.Company.industry.ilike(search_pattern)
            )
        )

    companies = query.order_by(
        desc(models.Company.verification_requested_at),
        desc(models.Company.created_at)
    ).all()

    requests_list = []
    for c in companies:
        admin_user = db.query(models.User).filter(models.User.id == c.user_id).first() if c.user_id else None
        requests_list.append({
            "id": c.id,
            "user_id": c.user_id,
            "company_name": c.company_name,
            "business_email": c.business_email or (admin_user.email if admin_user else ""),
            "phone": c.phone,
            "website": c.website,
            "location": c.location or c.headquarters_location,
            "headquarters_location": getattr(c, "headquarters_location", None) or c.location,
            "other_locations": getattr(c, "other_locations", None),
            "industry": c.industry or c.primary_industry,
            "primary_industry": getattr(c, "primary_industry", None) or c.industry,
            "sub_industry": getattr(c, "sub_industry", None),
            "organisation_type": getattr(c, "organisation_type", None),
            "year_founded": getattr(c, "year_founded", None),
            "linkedin_url": getattr(c, "linkedin_url", None),
            "company_size": c.company_size,
            "logo_url": c.logo_url,
            "about": c.about,
            "is_verified": bool(c.is_verified),
            "verification_status": c.verification_status or "PENDING_PROFILE",
            "verification_requested_at": c.verification_requested_at.isoformat() if getattr(c, "verification_requested_at", None) else None,
            "verification_reviewed_at": c.verification_reviewed_at.isoformat() if getattr(c, "verification_reviewed_at", None) else None,
            "verification_rejection_reason": getattr(c, "verification_rejection_reason", None),
            "plan_type": c.plan_type or "NONE",
            "plan_status": c.plan_status or "PENDING",
            "compliance_documents_data": getattr(c, "compliance_documents_data", None) or {},
            "business_model_data": getattr(c, "business_model_data", None) or {},
            "target_audience_data": getattr(c, "target_audience_data", None) or {},
            "growth_stage_data": getattr(c, "growth_stage_data", None) or {},
            "marketing_team_data": getattr(c, "marketing_team_data", None) or {},
            "hiring_defaults_data": getattr(c, "hiring_defaults_data", None) or {},
            "product_service": getattr(c, "product_service", None),
            "business_model": getattr(c, "business_model", None),
            "growth_stage": getattr(c, "growth_stage", None),
            "target_audience": getattr(c, "target_audience", None),
            "ideal_customer_profile": getattr(c, "ideal_customer_profile", None),
            "business_problem": getattr(c, "business_problem", None),
            "expected_outcome": getattr(c, "expected_outcome", None),
            "team_support": getattr(c, "team_support", None),
            "monthly_budget_range": getattr(c, "monthly_budget_range", None),
            "decision_authority": getattr(c, "decision_authority", None),
            "success_horizon": getattr(c, "success_horizon", None),
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return requests_list


@router.post("/companies/{company_id}/approve-verification")
def approve_company_verification(
    company_id: int,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Superadmin action: Approve company verification request and unlock Free Trial access.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    now = datetime.utcnow()
    company.is_verified = True
    company.verification_status = "VERIFIED"
    company.verification_reviewed_at = now
    company.verification_rejection_reason = None

    # If the company has no paid plan, activate Free Trial plan
    if not company.plan_type or company.plan_type in ["NONE", "FREE"]:
        free_cfg = PLAN_CONFIGS.get("FREE", {})
        company.plan_type = "FREE"
        company.plan_status = "ACTIVE"
        company.plan_activated_at = now
        duration = free_cfg.get("duration_days", 30)
        company.plan_expires_at = now + timedelta(days=duration)
        company.max_roles = free_cfg.get("max_roles", 1)
        company.max_jobs = free_cfg.get("max_jobs", 1)
        company.max_candidates_per_job = free_cfg.get("max_candidates_per_job", 5)
        company.sidebar_access = DEFAULT_SIDEBAR_ACCESS.get("FREE", {})

    # Mark user account verified
    if company.user_id:
        user = db.query(models.User).filter(models.User.id == company.user_id).first()
        if user:
            user.is_verified = True

    db.commit()
    db.refresh(company)

    return {
        "message": f"Company '{company.company_name}' successfully verified and Free Trial unlocked!",
        "company_id": company.id,
        "is_verified": company.is_verified,
        "verification_status": company.verification_status,
        "plan_type": company.plan_type,
        "plan_status": company.plan_status,
        "verification_reviewed_at": company.verification_reviewed_at.isoformat() if company.verification_reviewed_at else None
    }


@router.post("/companies/{company_id}/reject-verification")
def reject_company_verification(
    company_id: int,
    data: RejectCompanyVerificationRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Superadmin action: Reject company verification request with feedback reason.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    now = datetime.utcnow()
    company.is_verified = False
    company.verification_status = "REJECTED"
    company.verification_reviewed_at = now
    company.verification_rejection_reason = data.reason or "Compliance documents or profile details could not be validated. Please check and re-upload clear photos."

    # Mark user account unverified
    if company.user_id:
        user = db.query(models.User).filter(models.User.id == company.user_id).first()
        if user:
            user.is_verified = False

    db.commit()
    db.refresh(company)

    return {
        "message": f"Company '{company.company_name}' verification request rejected.",
        "company_id": company.id,
        "is_verified": company.is_verified,
        "verification_status": company.verification_status,
        "rejection_reason": company.verification_rejection_reason,
        "verification_reviewed_at": company.verification_reviewed_at.isoformat() if company.verification_reviewed_at else None
    }


@router.patch("/companies/{company_id}/status")
def toggle_company_status(
    company_id: int,
    data: ToggleCompanyStatusRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Superadmin action to activate or deactivate a company organization.
    When deactivated, all users (Admins, Recruiters, Hiring Managers) of this company are blocked from logging in.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.is_active = data.is_active
    company.plan_status = "ACTIVE" if data.is_active else "DEACTIVATED"

    db.commit()
    db.refresh(company)

    action_label = "activated" if data.is_active else "deactivated"
    access_label = "Login access restored for organization members." if data.is_active else "Login access has been revoked for all organization members."

    return {
        "message": f"Company '{company.company_name}' has been {action_label}. {access_label}",
        "company_id": company.id,
        "is_active": company.is_active,
        "plan_status": company.plan_status
    }


# ==========================================
# Candidate Directory & Management
# ==========================================

@router.get("/candidates")
def list_candidates(
    q: Optional[str] = Query(None, description="Search candidate name, email, skills, city, or title"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Retrieve all registered candidates with applications count, resume links, and verification status."""
    query = db.query(models.Candidate)

    if q and isinstance(q, str) and q.strip():
        search_pattern = f"%{q.strip()}%"
        # Search candidate fields or user email
        query = query.join(models.User, models.Candidate.user_id == models.User.id).filter(
            or_(
                models.Candidate.full_name.ilike(search_pattern),
                models.User.email.ilike(search_pattern),
                models.Candidate.city.ilike(search_pattern),
                models.Candidate.place.ilike(search_pattern),
                models.Candidate.title.ilike(search_pattern),
                models.Candidate.phone.ilike(search_pattern)
            )
        )

    candidates = query.order_by(desc(models.Candidate.created_at)).all()

    result = []
    for cd in candidates:
        u = db.query(models.User).filter(models.User.id == cd.user_id).first()
        apps_count = db.query(models.Application).filter(models.Application.candidate_id == cd.id).count()

        result.append({
            "id": cd.id,
            "user_id": cd.user_id,
            "full_name": cd.full_name,
            "email": u.email if u else "",
            "phone": cd.phone,
            "place": cd.place or cd.city,
            "city": cd.city,
            "state": cd.state,
            "title": cd.title or "Candidate",
            "skills": cd.skills or [],
            "experience_count": len(cd.experience or []),
            "education_count": len(cd.education or []),
            "resume_url": cd.resume_url,
            "resume_filename": cd.resume_filename,
            "portfolio_url": cd.portfolio_url,
            "avatar_url": cd.avatar_url,
            "is_verified": u.is_verified if u else False,
            "applications_count": apps_count,
            "views_count": cd.views_count or 0,
            "created_at": cd.created_at.isoformat() if cd.created_at else None
        })

    return result


@router.patch("/candidates/{candidate_id}/verification")
def toggle_candidate_verification(
    candidate_id: int,
    data: ToggleCandidateVerificationRequest,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Toggle candidate user verification status."""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    user = db.query(models.User).filter(models.User.id == candidate.user_id).first()
    if user:
        user.is_verified = data.is_verified
        db.commit()

    return {
        "message": f"Candidate '{candidate.full_name}' verification updated to {data.is_verified}.",
        "candidate_id": candidate.id,
        "is_verified": data.is_verified
    }


# ==========================================
# Recruiter Directory
# ==========================================

@router.get("/recruiters")
def list_recruiters(
    q: Optional[str] = Query(None, description="Search recruiter name, email, or company name"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Retrieve all recruiter and hiring manager user accounts registered across all companies."""
    members_query = db.query(models.CompanyMember)
    members = members_query.order_by(desc(models.CompanyMember.created_at)).all()

    result = []
    # 1. Add staff members
    for m in members:
        u = db.query(models.User).filter(models.User.id == m.user_id).first()
        comp = db.query(models.Company).filter(models.Company.id == m.company_id).first()

        recruiter_item = {
            "id": f"member_{m.id}",
            "member_id": m.id,
            "user_id": m.user_id,
            "name": m.name or "Staff Member",
            "email": u.email if u else "",
            "role": m.role or "RECRUITER",
            "title": m.title or ("Recruiter" if m.role == "RECRUITER" else "Hiring Manager"),
            "phone": m.phone or (comp.phone if comp else ""),
            "place": m.place or (comp.location if comp else ""),
            "company_id": m.company_id,
            "company_name": comp.company_name if comp else f"Company #{m.company_id}",
            "company_plan": comp.plan_type if comp else "FREE",
            "is_verified": u.is_verified if u else False,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }

        if q and isinstance(q, str) and q.strip():
            match = (
                q.lower() in recruiter_item["name"].lower() or
                q.lower() in recruiter_item["email"].lower() or
                q.lower() in recruiter_item["company_name"].lower()
            )
            if not match:
                continue

        result.append(recruiter_item)

    # 2. Add company admin accounts (primary company registrants)
    companies = db.query(models.Company).order_by(desc(models.Company.created_at)).all()
    for c in companies:
        u = db.query(models.User).filter(models.User.id == c.user_id).first()
        admin_item = {
            "id": f"admin_{c.id}",
            "member_id": None,
            "user_id": c.user_id,
            "name": f"{c.company_name} (Admin)",
            "email": u.email if u else c.business_email,
            "role": "ADMIN",
            "title": "Company Primary Administrator",
            "phone": c.phone or "",
            "place": c.location or "",
            "company_id": c.id,
            "company_name": c.company_name,
            "company_plan": c.plan_type or "FREE",
            "is_verified": u.is_verified if u else c.is_verified,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }

        if q and isinstance(q, str) and q.strip():
            match = (
                q.lower() in admin_item["name"].lower() or
                q.lower() in admin_item["email"].lower() or
                q.lower() in admin_item["company_name"].lower()
            )
            if not match:
                continue

        result.append(admin_item)

    return result


# ==========================================
# Payment & Transaction Audit Log
# ==========================================

@router.get("/payments")
def list_payments(
    status_filter: Optional[str] = Query(None, description="Filter by status: SUCCESS, PENDING, FAILED"),
    plan_id: Optional[str] = Query(None, description="Filter by plan: FREE, PLAN_4999, PLAN_14999"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Retrieve all payment transactions with Razorpay order, payment IDs, and associated company."""
    query = db.query(models.PaymentTransaction)

    if status_filter and isinstance(status_filter, str) and status_filter.strip():
        query = query.filter(models.PaymentTransaction.status == status_filter)

    if plan_id and isinstance(plan_id, str) and plan_id.strip():
        query = query.filter(models.PaymentTransaction.plan_id == plan_id)

    transactions = query.order_by(desc(models.PaymentTransaction.created_at)).all()

    result = []
    for tx in transactions:
        comp = db.query(models.Company).filter(models.Company.id == tx.company_id).first()
        user = db.query(models.User).filter(models.User.id == tx.user_id).first()

        plan_cfg = PLAN_CONFIGS.get(tx.plan_id, {})
        plan_name = plan_cfg.get("name", tx.plan_id)

        result.append({
            "id": tx.id,
            "company_id": tx.company_id,
            "company_name": comp.company_name if comp else f"Company #{tx.company_id}",
            "user_id": tx.user_id,
            "user_email": user.email if user else "",
            "plan_id": tx.plan_id,
            "plan_name": plan_name,
            "amount": tx.amount,
            "amount_display": f"₹{tx.amount:,}",
            "currency": tx.currency or "INR",
            "razorpay_order_id": tx.razorpay_order_id,
            "razorpay_payment_id": tx.razorpay_payment_id,
            "status": tx.status,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })

    return result
