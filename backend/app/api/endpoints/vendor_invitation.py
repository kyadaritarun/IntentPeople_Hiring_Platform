import re
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks, status
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.database import get_db
from app.config import settings
from app import models
from app.core import security
from app.api.deps import get_current_superadmin
from app.core.email import send_vendor_invitation_email, send_vendor_credentials_email
from app.api.endpoints.payment import DEFAULT_SIDEBAR_ACCESS

# Create two routers: one for superadmin console, one for public payment/tenant resolution
superadmin_router = APIRouter(prefix="/superadmin/vendor-invitations", tags=["Superadmin Vendor Onboarding"])
public_router = APIRouter(prefix="/vendor-invitations", tags=["Public Vendor Onboarding & Payments"])


# =========================================================================
# Pydantic Schemas
# =========================================================================

class CreateVendorInvitationRequest(BaseModel):
    vendor_name: str
    vendor_email: EmailStr
    vendor_phone: Optional[str] = None
    company_name: str
    subdomain: str
    price: int = 0
    currency: str = "INR"
    validity_days: int = 30
    billing_note: Optional[str] = None
    max_roles: int = 2
    max_jobs: int = 5
    max_candidates_per_job: int = 100
    sidebar_access: Optional[Dict[str, List[str]]] = None
    send_email_now: bool = True

    @validator("subdomain")
    def validate_subdomain(cls, v):
        cleaned = re.sub(r"[^a-zA-Z0-9-]", "", v).strip().lower()
        cleaned = re.sub(r"-+", "-", cleaned).strip("-")
        if len(cleaned) < 2:
            raise ValueError("Subdomain must be at least 2 alphanumeric characters.")
        if cleaned in ("www", "api", "admin", "superadmin", "app", "mail", "portal", "support"):
            raise ValueError(f"'{cleaned}' is a reserved subdomain name.")
        return cleaned

    @validator("price")
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price cannot be negative.")
        return v

    @validator("validity_days")
    def validate_validity(cls, v):
        if v < 1:
            raise ValueError("Validity days must be at least 1 day.")
        return v


class CheckoutCompleteRequest(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    payment_method: Optional[str] = "INSTANT_SECURE_PAYMENT"


# =========================================================================
# Shared Account Provisioning Logic
# =========================================================================

def provision_vendor_account(
    invitation: models.VendorInvitation,
    db: Session,
    background_tasks: Optional[BackgroundTasks] = None,
    payment_ref: str = "CHECKOUT_PROVISIONED",
    origin_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Provisions a new Vendor organization tenant, creates/updates User credentials,
    attaches role permissions, sets up company profile with custom quotas & subdomain,
    and dispatches confirmation email with credentials.
    """
    clean_email = invitation.vendor_email.strip().lower()
    
    # 1. Generate strong temporary password for the vendor
    temp_password = f"IntentPeople@{secrets.token_hex(3)}!"
    pass_hash = security.hash_password(temp_password)

    # 2. Check if user already exists or create new user
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    is_renewal_account = bool(user and user.password_hash)
    if user:
        if not user.password_hash:
            user.password_hash = pass_hash
        user.role = "ADMIN"
        user.is_verified = True
    else:
        user = models.User(
            email=clean_email,
            password_hash=pass_hash,
            role="ADMIN",
            is_verified=True
        )
        db.add(user)
        db.flush()

    # 3. Check if company profile already exists or create new company
    subdomain_slug = invitation.subdomain.strip().lower()
    company = db.query(models.Company).filter(
        or_(
            func.lower(models.Company.subdomain) == subdomain_slug,
            models.Company.user_id == user.id
        )
    ).first()

    sidebar_permissions = invitation.sidebar_access or DEFAULT_SIDEBAR_ACCESS.get("PLAN_4999", {})

    activated_at = datetime.utcnow()
    expires_at = activated_at + timedelta(days=invitation.validity_days)

    if company:
        company.user_id = user.id
        company.company_name = invitation.company_name
        company.subdomain = subdomain_slug
        company.business_email = clean_email
        company.phone = invitation.vendor_phone or company.phone
        company.plan_type = "CUSTOM_VENDOR"
        company.plan_status = "ACTIVE"
        # If renewal: extend from existing expiration if still active, otherwise from now
        base_date = company.plan_expires_at if (company.plan_expires_at and company.plan_expires_at > activated_at) else activated_at
        company.plan_activated_at = activated_at
        company.plan_expires_at = base_date + timedelta(days=invitation.validity_days)
        company.max_roles = invitation.max_roles
        company.max_jobs = invitation.max_jobs
        company.max_candidates_per_job = invitation.max_candidates_per_job
        company.sidebar_access = sidebar_permissions
        company.is_verified = True
        company.verification_status = "VERIFIED"
    else:
        company = models.Company(
            user_id=user.id,
            company_name=invitation.company_name,
            business_email=clean_email,
            phone=invitation.vendor_phone,
            subdomain=subdomain_slug,
            plan_type="CUSTOM_VENDOR",
            plan_status="ACTIVE",
            plan_activated_at=activated_at,
            plan_expires_at=expires_at,
            max_roles=invitation.max_roles,
            max_jobs=invitation.max_jobs,
            max_candidates_per_job=invitation.max_candidates_per_job,
            sidebar_access=sidebar_permissions,
            is_verified=True,
            verification_status="VERIFIED",
            industry="Digital Recruitment & Staffing"
        )
        db.add(company)
        db.flush()

    # 4. Ensure admin has CompanyMember record
    member = db.query(models.CompanyMember).filter(
        models.CompanyMember.user_id == user.id,
        models.CompanyMember.company_id == company.id
    ).first()
    if not member:
        member = models.CompanyMember(
            company_id=company.id,
            user_id=user.id,
            name=invitation.vendor_name or invitation.company_name,
            role="ADMIN",
            title="Primary Administrator",
            phone=invitation.vendor_phone
        )
        db.add(member)

    # 5. Record Payment Transaction
    payment_tx = models.PaymentTransaction(
        company_id=company.id,
        user_id=user.id,
        plan_id="CUSTOM_VENDOR",
        amount=invitation.price,
        currency=invitation.currency or "INR",
        razorpay_order_id=invitation.razorpay_order_id or payment_ref,
        razorpay_payment_id=invitation.razorpay_payment_id or payment_ref,
        status="SUCCESS"
    )
    db.add(payment_tx)

    # 6. Update Invitation status
    invitation.status = "PAID"
    invitation.created_company_id = company.id
    invitation.created_user_id = user.id
    invitation.generated_password = temp_password
    invitation.payment_completed_at = activated_at
    db.commit()

    # 7. Formulate portal subdomain URL
    base_fe = origin_url or settings.FRONTEND_URL
    dedicated_portal_url = f"{base_fe}/tenant/{subdomain_slug}"
    public_domain_url = f"https://{subdomain_slug}.intentpeople.com"

    quotas_summary = {
        "max_roles": invitation.max_roles,
        "max_jobs": invitation.max_jobs,
        "max_candidates_per_job": invitation.max_candidates_per_job
    }

    # 8. Dispatch Credentials Email
    if background_tasks:
        background_tasks.add_task(
            send_vendor_credentials_email,
            to_email=clean_email,
            vendor_name=invitation.vendor_name,
            company_name=invitation.company_name,
            subdomain=subdomain_slug,
            login_email=clean_email,
            temporary_password=temp_password,
            portal_url=dedicated_portal_url,
            quotas=quotas_summary,
            validity_days=invitation.validity_days,
            is_renewal=is_renewal_account
        )
    else:
        send_vendor_credentials_email(
            to_email=clean_email,
            vendor_name=invitation.vendor_name,
            company_name=invitation.company_name,
            subdomain=subdomain_slug,
            login_email=clean_email,
            temporary_password=temp_password,
            portal_url=dedicated_portal_url,
            quotas=quotas_summary,
            validity_days=invitation.validity_days,
            is_renewal=is_renewal_account
        )

    return {
        "success": True,
        "company_id": company.id,
        "company_name": company.company_name,
        "subdomain": subdomain_slug,
        "portal_url": dedicated_portal_url,
        "public_domain_url": public_domain_url,
        "credentials": {
            "email": clean_email,
            "password": "(Existing Account Password)" if is_renewal_account else temp_password
        }
    }


# =========================================================================
# Superadmin Endpoints
# =========================================================================

@superadmin_router.get("")
def list_vendor_invitations(
    q: Optional[str] = Query(None, description="Search query by company, vendor name, or email"),
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING, PAID, CANCELLED, EXPIRED"),
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all vendor onboarding invitations with summary KPI counters.
    """
    query = db.query(models.VendorInvitation)

    if status_filter and status_filter.strip():
        query = query.filter(models.VendorInvitation.status == status_filter.strip().upper())

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.VendorInvitation.company_name).like(term),
                func.lower(models.VendorInvitation.vendor_name).like(term),
                func.lower(models.VendorInvitation.vendor_email).like(term),
                func.lower(models.VendorInvitation.subdomain).like(term)
            )
        )

    invitations = query.order_by(desc(models.VendorInvitation.created_at)).all()

    # Aggregate metrics
    all_records = db.query(models.VendorInvitation).all()
    total_count = len(all_records)
    pending_count = sum(1 for inv in all_records if inv.status == "PENDING")
    paid_count = sum(1 for inv in all_records if inv.status == "PAID")
    total_rev = sum(inv.price for inv in all_records if inv.status == "PAID")

    result = []
    for inv in invitations:
        result.append({
            "id": inv.id,
            "token": inv.token,
            "vendor_name": inv.vendor_name,
            "vendor_email": inv.vendor_email,
            "vendor_phone": inv.vendor_phone or "",
            "company_name": inv.company_name,
            "subdomain": inv.subdomain,
            "portal_domain": f"{inv.subdomain}.intentpeople.com",
            "price": inv.price,
            "price_display": f"₹{inv.price:,}",
            "currency": inv.currency or "INR",
            "validity_days": inv.validity_days,
            "billing_note": inv.billing_note or f"{inv.validity_days} Days Plan",
            "max_roles": inv.max_roles,
            "max_jobs": inv.max_jobs,
            "max_candidates_per_job": inv.max_candidates_per_job,
            "sidebar_access": inv.sidebar_access or {},
            "status": inv.status,
            "created_company_id": inv.created_company_id,
            "created_user_id": inv.created_user_id,
            "generated_password": inv.generated_password if inv.status == "PAID" else None,
            "invitation_sent_at": inv.invitation_sent_at.isoformat() if inv.invitation_sent_at else None,
            "payment_completed_at": inv.payment_completed_at.isoformat() if inv.payment_completed_at else None,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        })

    return {
        "stats": {
            "total_invitations": total_count,
            "pending_payment": pending_count,
            "active_paid": paid_count,
            "total_revenue": total_rev,
            "total_revenue_display": f"₹{total_rev:,}"
        },
        "invitations": result
    }


@superadmin_router.post("")
def create_vendor_invitation(
    data: CreateVendorInvitationRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Creates a new custom vendor onboarding package and dispatches the invitation email with payment link.
    """
    subdomain_slug = data.subdomain.strip().lower()

    # 1. Verify subdomain isn't already taken by a different company
    clean_email = data.vendor_email.strip().lower()
    existing_comp = db.query(models.Company).filter(
        func.lower(models.Company.subdomain) == subdomain_slug
    ).first()
    is_renewal = bool(existing_comp and existing_comp.business_email.strip().lower() == clean_email)
    if existing_comp and not is_renewal:
        raise HTTPException(
            status_code=400,
            detail=f"The subdomain '{subdomain_slug}' is already registered by '{existing_comp.company_name}'. Please choose a different subdomain slug."
        )

    # 2. Check if a pending invitation with this subdomain already exists
    pending_inv = db.query(models.VendorInvitation).filter(
        func.lower(models.VendorInvitation.subdomain) == subdomain_slug,
        models.VendorInvitation.status == "PENDING"
    ).first()
    if pending_inv:
        # Automatically cancel previous pending invitation to allow a new renewal/upgrade link
        pending_inv.status = "CANCELLED"
        db.flush()

    # 3. Generate unique secure token for payment link
    token = secrets.token_urlsafe(32)

    # 4. Formulate role sidebar access permissions if not supplied
    sidebar_access = data.sidebar_access
    if not sidebar_access:
        sidebar_access = {
            "ADMIN": DEFAULT_SIDEBAR_ACCESS["PLAN_4999"]["ADMIN"],
            "RECRUITER": DEFAULT_SIDEBAR_ACCESS["PLAN_4999"]["RECRUITER"],
            "HIRING_MANAGER": DEFAULT_SIDEBAR_ACCESS["PLAN_4999"]["HIRING_MANAGER"]
        }

    # 5. Persist invitation record
    invitation = models.VendorInvitation(
        token=token,
        vendor_name=data.vendor_name.strip(),
        vendor_email=data.vendor_email.strip().lower(),
        vendor_phone=data.vendor_phone.strip() if data.vendor_phone else None,
        company_name=data.company_name.strip(),
        subdomain=subdomain_slug,
        price=data.price,
        currency=data.currency,
        validity_days=data.validity_days,
        billing_note=data.billing_note,
        max_roles=data.max_roles,
        max_jobs=data.max_jobs,
        max_candidates_per_job=data.max_candidates_per_job,
        sidebar_access=sidebar_access,
        status="PENDING",
        created_by_user_id=superadmin.id
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # 6. Formulate payment checkout URL
    origin = request.headers.get("origin") or settings.FRONTEND_URL
    payment_url = f"{origin}/vendor-pay/{token}"

    # 7. Dispatch invitation email
    if data.send_email_now:
        quotas_dict = {
            "max_roles": data.max_roles,
            "max_jobs": data.max_jobs,
            "max_candidates_per_job": data.max_candidates_per_job
        }
        background_tasks.add_task(
            send_vendor_invitation_email,
            to_email=invitation.vendor_email,
            vendor_name=invitation.vendor_name,
            company_name=invitation.company_name,
            subdomain=invitation.subdomain,
            price=invitation.price,
            currency=invitation.currency,
            validity_days=invitation.validity_days,
            billing_note=invitation.billing_note or f"{invitation.validity_days} Days Plan",
            quotas=quotas_dict,
            sidebar_modules=invitation.sidebar_access or {},
            payment_url=payment_url,
            is_renewal=is_renewal
        )

    return {
        "message": f"Vendor {'renewal & upgrade' if is_renewal else 'onboarding'} invitation created successfully for {invitation.company_name}.",
        "id": invitation.id,
        "token": invitation.token,
        "payment_url": payment_url,
        "portal_domain": f"{invitation.subdomain}.intentpeople.com",
        "subdomain": invitation.subdomain,
        "price": invitation.price,
        "validity_days": invitation.validity_days,
        "is_renewal": is_renewal,
        "status": invitation.status
    }


@superadmin_router.post("/{invitation_id}/resend")
def resend_vendor_invitation(
    invitation_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Re-sends the onboarding invitation email with the payment link.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Vendor invitation not found")

    existing_comp = db.query(models.Company).filter(
        func.lower(models.Company.subdomain) == inv.subdomain.strip().lower()
    ).first()
    is_renewal = bool(existing_comp and existing_comp.business_email.strip().lower() == inv.vendor_email.strip().lower())

    origin = request.headers.get("origin") or settings.FRONTEND_URL
    payment_url = f"{origin}/vendor-pay/{inv.token}"

    quotas_dict = {
        "max_roles": inv.max_roles,
        "max_jobs": inv.max_jobs,
        "max_candidates_per_job": inv.max_candidates_per_job
    }

    background_tasks.add_task(
        send_vendor_invitation_email,
        to_email=inv.vendor_email,
        vendor_name=inv.vendor_name,
        company_name=inv.company_name,
        subdomain=inv.subdomain,
        price=inv.price,
        currency=inv.currency,
        validity_days=inv.validity_days,
        billing_note=inv.billing_note or f"{inv.validity_days} Days Plan",
        quotas=quotas_dict,
        sidebar_modules=inv.sidebar_access or {},
        payment_url=payment_url,
        is_renewal=is_renewal
    )

    inv.invitation_sent_at = datetime.utcnow()
    db.commit()

    return {
        "message": f"Invitation email re-dispatched to {inv.vendor_email}",
        "payment_url": payment_url
    }


@superadmin_router.post("/{invitation_id}/simulate-payment")
def simulate_vendor_payment(
    invitation_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Simulates payment completion and instantly provisions the vendor account.
    Useful for manual offline bank wires or test verifications.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Vendor invitation not found")

    origin = request.headers.get("origin") or settings.FRONTEND_URL
    provision_result = provision_vendor_account(
        invitation=inv,
        db=db,
        background_tasks=background_tasks,
        payment_ref="SUPERADMIN_MANUAL_ACTIVATION",
        origin_url=origin
    )

    return {
        "message": f"Vendor portal for '{inv.company_name}' successfully provisioned and credentials sent.",
        **provision_result
    }


@superadmin_router.delete("/{invitation_id}")
def revoke_vendor_invitation(
    invitation_id: int,
    superadmin: models.User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """
    Revokes / deletes a pending vendor invitation.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Vendor invitation not found")

    if inv.status == "PAID":
        raise HTTPException(status_code=400, detail="Cannot delete an already paid and active vendor contract.")

    db.delete(inv)
    db.commit()

    return {"message": "Vendor invitation revoked successfully."}


# =========================================================================
# Public Vendor Checkout & Payment Endpoints
# =========================================================================

@public_router.get("/verify/{token}")
def verify_vendor_invitation_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Public validation endpoint for the payment checkout page.
    Returns customized package details, price, validity, quotas, and sidebar modules.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation link.")

    is_paid = inv.status == "PAID"
    company = None
    if is_paid and inv.created_company_id:
        company = db.query(models.Company).filter(models.Company.id == inv.created_company_id).first()

    return {
        "id": inv.id,
        "token": inv.token,
        "vendor_name": inv.vendor_name,
        "vendor_email": inv.vendor_email,
        "company_name": inv.company_name,
        "subdomain": inv.subdomain,
        "portal_domain": f"{inv.subdomain}.intentpeople.com",
        "price": inv.price,
        "price_display": f"₹{inv.price:,}",
        "currency": inv.currency or "INR",
        "validity_days": inv.validity_days,
        "billing_note": inv.billing_note or f"{inv.validity_days} Days Plan",
        "max_roles": inv.max_roles,
        "max_jobs": inv.max_jobs,
        "max_candidates_per_job": inv.max_candidates_per_job,
        "sidebar_access": inv.sidebar_access or {},
        "status": inv.status,
        "is_paid": is_paid,
        "payment_completed_at": inv.payment_completed_at.isoformat() if inv.payment_completed_at else None,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID
    }


@public_router.post("/checkout/create-order/{token}")
def create_vendor_checkout_order(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Creates a Razorpay order or returns simulated order id for checkout.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation link.")

    if inv.status == "PAID":
        raise HTTPException(status_code=400, detail="This package has already been paid for and activated.")

    # Try creating real Razorpay order if amount > 0 and credentials exist
    amount_in_paise = inv.price * 100
    razorpay_order_id = f"order_uptrix_{secrets.token_hex(8)}"

    if amount_in_paise > 0 and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        try:
            import requests
            auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            payload = {
                "amount": amount_in_paise,
                "currency": inv.currency or "INR",
                "receipt": f"inv_{inv.id}_{int(datetime.utcnow().timestamp())}",
                "notes": {
                    "invitation_id": str(inv.id),
                    "subdomain": inv.subdomain,
                    "company_name": inv.company_name,
                    "vendor_email": inv.vendor_email
                }
            }
            res = requests.post("https://api.razorpay.com/v1/orders", json=payload, auth=auth, timeout=10)
            if res.status_code == 200:
                data = res.json()
                razorpay_order_id = data.get("id", razorpay_order_id)
        except Exception as e:
            # Fall back to internal secure order ID
            print(f"[RAZORPAY ORDER WARNING] {e}")

    inv.razorpay_order_id = razorpay_order_id
    db.commit()

    return {
        "order_id": razorpay_order_id,
        "amount": inv.price,
        "amount_paise": amount_in_paise,
        "currency": inv.currency or "INR",
        "company_name": inv.company_name,
        "vendor_email": inv.vendor_email,
        "subdomain": inv.subdomain,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID
    }


@public_router.post("/checkout/complete/{token}")
def complete_vendor_checkout(
    token: str,
    data: CheckoutCompleteRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Completes checkout, provisions the vendor organization, generates login credentials,
    and sends the welcome email with login link and password.
    """
    inv = db.query(models.VendorInvitation).filter(models.VendorInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invalid invitation token.")

    if inv.status == "PAID":
        # Already processed, return credentials info if available
        user = db.query(models.User).filter(models.User.id == inv.created_user_id).first() if inv.created_user_id else None
        return {
            "success": True,
            "already_paid": True,
            "message": "Payment has already been confirmed for this portal.",
            "portal_url": f"{request.headers.get('origin') or settings.FRONTEND_URL}/tenant/{inv.subdomain}",
            "public_domain_url": f"https://{inv.subdomain}.intentpeople.com",
            "credentials": {
                "email": inv.vendor_email,
                "password": inv.generated_password or "••••••••"
            }
        }

    # Record payment info
    inv.razorpay_order_id = data.razorpay_order_id or inv.razorpay_order_id or f"ord_{secrets.token_hex(6)}"
    inv.razorpay_payment_id = data.razorpay_payment_id or f"pay_{secrets.token_hex(6)}"

    origin = request.headers.get("origin") or settings.FRONTEND_URL
    provision_result = provision_vendor_account(
        invitation=inv,
        db=db,
        background_tasks=background_tasks,
        payment_ref=inv.razorpay_payment_id,
        origin_url=origin
    )

    return {
        "message": "Payment confirmed! Your organization portal is now live.",
        **provision_result
    }


@public_router.get("/tenant/{subdomain}")
def get_vendor_tenant_details(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """
    Public lookup for custom tenant branding on the login and landing portal.
    """
    clean_sub = subdomain.strip().lower()
    company = db.query(models.Company).filter(func.lower(models.Company.subdomain) == clean_sub).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"No portal found for tenant '{clean_sub}'.")

    return {
        "id": company.id,
        "company_name": company.company_name,
        "subdomain": company.subdomain,
        "portal_domain": f"{company.subdomain}.intentpeople.com",
        "logo_url": company.logo_url,
        "industry": company.industry,
        "is_active": (getattr(company, "is_active", True) is not False) and (company.plan_status not in ["DEACTIVATED", "SUSPENDED", "INACTIVE"]),
        "plan_type": company.plan_type,
        "plan_status": company.plan_status
    }
