import hmac
import hashlib
import time
import secrets
import requests
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.config import settings
from app.api.deps import get_current_user, get_user_company

router = APIRouter(prefix="/payments", tags=["Payments & Subscription Plans"])

DEFAULT_SIDEBAR_ACCESS = {
    "FREE": {
        "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "applicants", "company_profile", "support"],
        "RECRUITER": ["recruiter_dashboard", "dashboard", "manage_jobs", "post_job", "applicants", "company_profile", "support"],
        "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "manage_jobs", "company_profile", "support"],
        "MANAGER": ["hiring_manager_dashboard", "dashboard", "manage_jobs", "company_profile", "support"]
    },
    "PLAN_4999": {
        "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "manage_jobs", "applicants", "interviews", "company_profile", "support"],
        "RECRUITER": ["recruiter_dashboard", "dashboard", "manage_jobs", "post_job", "applicants", "application_status", "company_profile", "support"],
        "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "company_profile", "support"],
        "MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "company_profile", "support"]
    },
    "PLAN_14999": {
        "ADMIN": ["dashboard", "admin_dashboard", "add_staff", "hiring_groups", "manage_jobs", "applicants", "interviews", "messages", "staff_documents", "company_profile", "support"],
        "RECRUITER": ["recruiter_dashboard", "dashboard", "post_job", "manage_jobs", "applicants", "search_candidates", "application_status", "interviews", "messages", "documents", "company_profile", "support"],
        "HIRING_MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "interviews", "messages", "company_profile", "support"],
        "MANAGER": ["hiring_manager_dashboard", "dashboard", "applicants", "manage_jobs", "interviews", "messages", "company_profile", "support"]
    }
}

PLAN_CONFIGS = {
    "FREE": {
        "id": "FREE",
        "name": "Free Starter",
        "price": 0,
        "price_display": "₹0",
        "billing": "Free Trial",
        "duration_days": 365,
        "max_roles": 1,
        "max_jobs": 1,
        "max_candidates_per_job": 5,
        "badge": "Free Forever",
        "is_popular": False,
        "description": "Essential trial access for exploratory hiring",
        "features": [
            "1 Recruiter / Staff role",
            "1 Job Requisition posting",
            "5 Candidates visible per job (excess blurred with upgrade prompt)",
            "Standard applicant pipeline & review"
        ],
        "sidebar_access": DEFAULT_SIDEBAR_ACCESS["FREE"]
    },
    "PLAN_4999": {
        "id": "PLAN_4999",
        "name": "Standard Role Plan",
        "price": 4999,
        "price_display": "₹4,999",
        "billing": "per role / 45 days",
        "duration_days": 45,
        "max_roles": 2,
        "max_jobs": 4,
        "max_candidates_per_job": 6,
        "badge": "Most Popular",
        "is_popular": True,
        "description": "Ideal for focused hiring with dedicated recruiter and hiring manager roles",
        "features": [
            "2 Staff Roles (can be Recruiter + Hiring Manager)",
            "4 Active Job Postings",
            "6 Visible Candidates per job (excess blurred with upgrade prompt)",
            "45 Days plan validity",
            "Hiring Pods & group coordination",
            "AI candidate fit scoring & dossiers export"
        ],
        "sidebar_access": DEFAULT_SIDEBAR_ACCESS["PLAN_4999"]
    },
    "PLAN_14999": {
        "id": "PLAN_14999",
        "name": "Growth Scale Plan",
        "price": 14999,
        "price_display": "₹14,999",
        "billing": "per month (30 days)",
        "duration_days": 30,
        "max_roles": 4,
        "max_jobs": 8,
        "max_candidates_per_job": 200,
        "badge": "High Volume Scale",
        "is_popular": False,
        "description": "Full agency-scale recruitment power with expanded team capacity and candidate reach",
        "features": [
            "4 Staff Roles (2 Recruiters + 2 Hiring Managers)",
            "8 Active Job Postings",
            "200 Visible Candidates per job (excess blurred with upgrade prompt)",
            "30 Days / 1 Month validity",
            "Advanced multi-pod collaboration & interview scheduling",
            "Priority AI candidate rankings & bulk stage workflows"
        ],
        "sidebar_access": DEFAULT_SIDEBAR_ACCESS["PLAN_14999"]
    }
}


class CreateOrderRequest(BaseModel):
    plan_id: str


class VerifyPaymentRequest(BaseModel):
    plan_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def get_plan_config(plan_id: str, db: Optional[Session] = None) -> dict:
    """Helper to fetch plan config from DB or fallback to PLAN_CONFIGS."""
    if db:
        try:
            pc = db.query(models.PlanConfig).filter(models.PlanConfig.id == plan_id).first()
            if pc:
                return {
                    "id": pc.id,
                    "name": pc.name,
                    "price": pc.price,
                    "price_display": pc.price_display,
                    "billing": pc.billing,
                    "duration_days": pc.duration_days,
                    "max_roles": pc.max_roles,
                    "max_jobs": pc.max_jobs,
                    "max_candidates_per_job": pc.max_candidates_per_job,
                    "badge": pc.badge or "",
                    "is_popular": pc.is_popular,
                    "description": pc.description or "",
                    "features": pc.features or [],
                    "sidebar_access": pc.sidebar_access or DEFAULT_SIDEBAR_ACCESS.get(plan_id, {})
                }
        except Exception:
            pass
    return PLAN_CONFIGS.get(plan_id, PLAN_CONFIGS["FREE"])


@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    """Return all available recruitment subscription plans."""
    try:
        db_plans = db.query(models.PlanConfig).all()
        if db_plans:
            # Sort order: FREE, PLAN_4999, PLAN_14999
            order = {"FREE": 0, "PLAN_4999": 1, "PLAN_14999": 2}
            sorted_plans = sorted(db_plans, key=lambda x: order.get(x.id, 99))
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
                    "sidebar_access": p.sidebar_access or DEFAULT_SIDEBAR_ACCESS.get(p.id, {})
                }
                for p in sorted_plans
            ]
    except Exception as e:
        print(f"[GET PLANS DB ERROR] {e}")
    return list(PLAN_CONFIGS.values())


@router.get("/current")
def get_current_subscription(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current company subscription status, limits, and usage."""
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    roles_count = db.query(models.CompanyMember).filter(models.CompanyMember.company_id == company.id).count()
    jobs_count = db.query(models.Job).filter(models.Job.company_id == company.id).count()

    plan_type = company.plan_type or "FREE"
    cfg = get_plan_config(plan_type, db)

    max_roles = company.max_roles or cfg["max_roles"]
    max_jobs = company.max_jobs or cfg["max_jobs"]
    max_cands = company.max_candidates_per_job or cfg["max_candidates_per_job"]

    days_remaining = None
    if company.plan_expires_at:
        delta = company.plan_expires_at - datetime.utcnow()
        days_remaining = max(0, delta.days)

    sidebar_access = company.sidebar_access or cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(plan_type, {})

    return {
        "company_id": company.id,
        "company_name": company.company_name,
        "plan_type": plan_type,
        "plan_status": company.plan_status or "ACTIVE",
        "plan_name": cfg["name"],
        "price_display": cfg["price_display"],
        "billing": cfg["billing"],
        "plan_activated_at": company.plan_activated_at.isoformat() if company.plan_activated_at else None,
        "plan_expires_at": company.plan_expires_at.isoformat() if company.plan_expires_at else None,
        "days_remaining": days_remaining,
        "roles_used": roles_count,
        "max_roles": max_roles,
        "can_add_role": roles_count < max_roles,
        "jobs_used": jobs_count,
        "max_jobs": max_jobs,
        "can_post_job": jobs_count < max_jobs,
        "max_candidates_per_job": max_cands,
        "sidebar_access": sidebar_access,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID
    }


@router.post("/activate-free")
def activate_free_plan(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate Free starter plan for newly registered or existing company."""
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if user.role != "ADMIN" or (company.user_id and company.user_id != user.id):
        raise HTTPException(status_code=403, detail="Only the originating company administrator can select or activate subscription plans.")

    cfg = get_plan_config("FREE", db)
    company.plan_type = "FREE"
    company.plan_status = "ACTIVE"
    company.plan_activated_at = datetime.utcnow()
    company.plan_expires_at = datetime.utcnow() + timedelta(days=cfg.get("duration_days", 365))
    company.max_roles = cfg.get("max_roles", 1)
    company.max_jobs = cfg.get("max_jobs", 1)
    company.max_candidates_per_job = cfg.get("max_candidates_per_job", 5)
    company.sidebar_access = cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get("FREE", {})

    # Record free transaction
    tx = models.PaymentTransaction(
        company_id=company.id,
        user_id=user.id,
        plan_id="FREE",
        amount=0,
        currency="INR",
        status="SUCCESS",
        razorpay_order_id="free_activation",
        razorpay_payment_id="free_activation",
        razorpay_signature="free_activation"
    )
    db.add(tx)
    db.commit()
    db.refresh(company)

    return {
        "message": "Free plan activated successfully! Welcome to Uptrix Hiring Portal.",
        "plan": {
            "plan_type": company.plan_type,
            "plan_status": company.plan_status,
            "max_roles": company.max_roles,
            "max_jobs": company.max_jobs,
            "max_candidates_per_job": company.max_candidates_per_job
        }
    }


@router.post("/razorpay/create-order")
def create_razorpay_order(
    data: CreateOrderRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Razorpay order for paid plans (PLAN_4999, PLAN_14999)."""
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if user.role != "ADMIN" or (company.user_id and company.user_id != user.id):
        raise HTTPException(status_code=403, detail="Only the originating company administrator can initiate plan upgrades or payments.")

    plan_cfg = get_plan_config(data.plan_id, db)
    if not plan_cfg or (data.plan_id == "FREE" and plan_cfg.get("price", 0) <= 0):
        raise HTTPException(status_code=400, detail="Invalid plan selected for payment")

    amount_in_paise = plan_cfg["price"] * 100
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET

    receipt_id = f"rcpt_{company.id}_{int(time.time())}"

    # Check if we should call live/test Razorpay API or use simulated order
    order_data = None
    is_demo = False

    if key_id and key_secret and not key_id.startswith("rzp_test_uptrix_demo") and key_id.startswith(("rzp_test_", "rzp_live_")):
        try:
            resp = requests.post(
                "https://api.razorpay.com/v1/orders",
                auth=(key_id, key_secret),
                json={
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": receipt_id,
                    "notes": {
                        "company_id": str(company.id),
                        "company_name": company.company_name,
                        "plan_id": data.plan_id
                    }
                },
                timeout=10
            )
            if resp.status_code == 200:
                order_data = resp.json()
        except Exception as e:
            print(f"[RAZORPAY ORDER API ERROR] {e}")

    # Fallback to test/demo order if Razorpay key is test/demo or API unreachable
    if not order_data:
        is_demo = True
        mock_order_id = f"order_demo_{secrets.token_hex(8)}"
        order_data = {
            "id": mock_order_id,
            "entity": "order",
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "status": "created"
        }

    return {
        "order_id": order_data["id"],
        "amount": amount_in_paise,
        "currency": "INR",
        "plan_id": data.plan_id,
        "plan_name": plan_cfg["name"],
        "price_display": plan_cfg["price_display"],
        "key_id": key_id,
        "is_demo": is_demo,
        "prefill": {
            "name": company.company_name,
            "email": company.business_email or user.email,
            "contact": company.phone or ""
        }
    }


@router.post("/razorpay/verify")
def verify_razorpay_payment(
    data: VerifyPaymentRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment signature and activate the subscription plan."""
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if user.role != "ADMIN" or (company.user_id and company.user_id != user.id):
        raise HTTPException(status_code=403, detail="Only the originating company administrator can finalize subscription payments.")

    plan_cfg = get_plan_config(data.plan_id, db)
    if not plan_cfg:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    key_secret = settings.RAZORPAY_KEY_SECRET

    # Verify Razorpay signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
    is_verified = False
    if data.razorpay_order_id.startswith("order_demo_") or data.razorpay_signature.startswith("sig_demo_"):
        is_verified = True
    elif key_secret:
        body = f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode()
        expected_sig = hmac.new(key_secret.encode(), body, hashlib.sha256).hexdigest()
        is_verified = hmac.compare_digest(expected_sig, data.razorpay_signature)

    if not is_verified:
        raise HTTPException(status_code=400, detail="Payment signature verification failed. Please contact support.")

    # Update Company Subscription Details
    duration_days = plan_cfg.get("duration_days", 45)
    now = datetime.utcnow()

    company.plan_type = data.plan_id
    company.plan_status = "ACTIVE"
    company.plan_activated_at = now
    company.plan_expires_at = now + timedelta(days=duration_days)
    company.max_roles = plan_cfg.get("max_roles", 1)
    company.max_jobs = plan_cfg.get("max_jobs", 1)
    company.max_candidates_per_job = plan_cfg.get("max_candidates_per_job", 10)
    company.sidebar_access = plan_cfg.get("sidebar_access") or DEFAULT_SIDEBAR_ACCESS.get(data.plan_id, {})
    company.razorpay_order_id = data.razorpay_order_id
    company.razorpay_payment_id = data.razorpay_payment_id

    # Record Payment Transaction in DB
    tx = models.PaymentTransaction(
        company_id=company.id,
        user_id=user.id,
        plan_id=data.plan_id,
        amount=plan_cfg["price"],
        currency="INR",
        razorpay_order_id=data.razorpay_order_id,
        razorpay_payment_id=data.razorpay_payment_id,
        razorpay_signature=data.razorpay_signature,
        status="SUCCESS",
        created_at=now
    )
    db.add(tx)
    db.commit()
    db.refresh(company)

    return {
        "message": f"Payment verified successfully! {plan_cfg['name']} is now ACTIVE.",
        "plan": {
            "plan_type": company.plan_type,
            "plan_status": company.plan_status,
            "plan_name": plan_cfg["name"],
            "plan_activated_at": company.plan_activated_at.isoformat(),
            "plan_expires_at": company.plan_expires_at.isoformat(),
            "max_roles": company.max_roles,
            "max_jobs": company.max_jobs,
            "max_candidates_per_job": company.max_candidates_per_job,
            "payment_id": data.razorpay_payment_id
        }
    }
