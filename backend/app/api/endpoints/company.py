from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core import security
from app.api.deps import get_current_user, get_user_company
from app.services.s3 import upload_file_to_s3

router = APIRouter(prefix="/companies", tags=["Company & Recruiter"])

@router.put("/me")
def update_company(data: schemas.CompanyProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can update company profile")
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(company, field, val)
    db.commit()
    db.refresh(company)
    return company

@router.post("/verify")
def submit_verification(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can request verification")
    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    company.is_verified = True
    company.verification_status = "VERIFIED"
    db.commit()
    return {"message": "Company verification approved successfully!", "verification_status": "VERIFIED"}

@router.get("/team")
def get_team_members(
    include_admin: bool = False,
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    company = get_user_company(user, db)
    if not company:
        return []

    # Get all staff members linked to this company
    members = db.query(models.CompanyMember).filter(models.CompanyMember.company_id == company.id).order_by(models.CompanyMember.id.desc()).all()
    result = []

    # Bulk fetch group memberships
    all_member_ids = [m.id for m in members]
    group_map = {mid: [] for mid in all_member_ids}
    if all_member_ids:
        try:
            group_links = db.query(
                models.StaffGroupMember.member_id,
                models.StaffGroup.id,
                models.StaffGroup.name,
                models.StaffGroup.department
            ).join(
                models.StaffGroup, models.StaffGroup.id == models.StaffGroupMember.group_id
            ).filter(
                models.StaffGroupMember.member_id.in_(all_member_ids)
            ).all()
            for mid, gid, gname, gdept in group_links:
                group_map[mid].append({"id": gid, "name": gname, "department": gdept})
        except Exception:
            pass

    # Only include Organization Administrator if explicitly requested (e.g. for internal chat directory)
    if include_admin:
        admin_user = db.query(models.User).filter(models.User.id == company.user_id).first() if company.user_id else None
        if admin_user:
            result.append({
                "id": f"admin-{admin_user.id}",
                "user_id": admin_user.id,
                "name": f"{company.company_name} Administrator",
                "email": admin_user.email,
                "role": "ADMIN",
                "title": "Organization Administrator",
                "phone": company.phone or "",
                "place": company.location or "",
                "avatar_url": company.logo_url,
                "groups": [],
                "created_at": company.created_at.isoformat() if company.created_at else None
            })

    for m in members:
        user_rec = db.query(models.User).filter(models.User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "name": m.name,
            "email": user_rec.email if user_rec else "",
            "role": m.role,
            "title": m.title or ("Recruiter" if m.role == "RECRUITER" else "Hiring Manager"),
            "phone": m.phone or "",
            "place": m.place or "",
            "avatar_url": m.avatar_url,
            "groups": group_map.get(m.id, []),
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    return result

@router.put("/staff/me")
def update_staff_member_profile(
    data: schemas.MemberProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    company = get_user_company(user, db)
    member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first()

    if not member:
        if not company:
            raise HTTPException(status_code=404, detail="Company association not found")
        member = models.CompanyMember(
            company_id=company.id,
            user_id=user.id,
            name=data.name or (company.company_name if company else "Staff Member"),
            role=user.role,
            title=data.title or ("Technical Recruiter" if user.role == "RECRUITER" else ("Hiring Manager" if user.role == "HIRING_MANAGER" else "Administrator")),
            phone=data.phone,
            place=data.place,
            avatar_url=data.avatar_url
        )
        db.add(member)
    else:
        if data.name is not None:
            member.name = data.name.strip()
        if data.phone is not None:
            member.phone = data.phone.strip()
        if data.place is not None:
            member.place = data.place.strip()
        if data.title is not None:
            member.title = data.title.strip()
        if data.avatar_url is not None:
            member.avatar_url = data.avatar_url

    if company and company.user_id == user.id:
        if data.phone:
            company.phone = data.phone.strip()
        if data.place:
            company.location = data.place.strip()

    db.commit()
    db.refresh(member)
    return {
        "message": "Staff profile updated successfully!",
        "member": {
            "id": member.id,
            "name": member.name,
            "email": user.email,
            "phone": member.phone or "",
            "place": member.place or "",
            "role": member.role,
            "title": member.title,
            "avatar_url": member.avatar_url
        }
    }

@router.post("/staff/me/photo")
def upload_staff_personal_photo(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=user.id)
    member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first()
    company = get_user_company(user, db)

    if member:
        member.avatar_url = file_url
        db.commit()
        db.refresh(member)
    elif company and company.user_id == user.id:
        company.logo_url = file_url
        db.commit()

    return {
        "message": "Profile photo uploaded successfully to AWS S3!",
        "avatar_url": file_url
    }

@router.post("/team/photo")
def upload_team_member_photo(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can upload staff photos")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=company.id)
    return {
        "message": "Staff photo uploaded successfully to AWS S3!",
        "avatar_url": file_url
    }

@router.post("/logo")
def upload_company_logo(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can upload company logo")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=company.id)
    company.logo_url = file_url
    db.commit()
    db.refresh(company)
    return {
        "message": "Company logo uploaded successfully to AWS S3!",
        "logo_url": file_url
    }

@router.post("/team", status_code=201)
def create_team_member(data: schemas.TeamMemberCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can create team members")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    target_role = data.role.upper().strip()
    if target_role not in ["RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=400, detail="Role must be either RECRUITER or HIRING_MANAGER")

    existing = db.query(models.User).filter(models.User.email == data.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"An account with email '{data.email}' already exists")

    # Create new verified User account
    new_user = models.User(
        email=data.email.strip().lower(),
        password_hash=security.hash_password(data.password),
        role=target_role,
        is_verified=True
    )
    db.add(new_user)
    db.flush()

    member = models.CompanyMember(
        company_id=company.id,
        user_id=new_user.id,
        name=data.name.strip(),
        role=target_role,
        title=data.title.strip() if data.title else ("Technical Recruiter" if target_role == "RECRUITER" else "Hiring Manager"),
        avatar_url=data.avatar_url
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    assigned_groups = []
    if data.group_ids:
        for gid in data.group_ids:
            grp = db.query(models.StaffGroup).filter(
                models.StaffGroup.id == gid,
                models.StaffGroup.company_id == company.id
            ).first()
            if grp:
                db.add(models.StaffGroupMember(group_id=grp.id, member_id=member.id))
                assigned_groups.append({"id": grp.id, "name": grp.name, "department": grp.department})
        db.commit()

    return {
        "message": f"Successfully created {target_role.replace('_', ' ').title()} account for {data.name}!",
        "member": {
            "id": member.id,
            "user_id": new_user.id,
            "name": member.name,
            "email": new_user.email,
            "role": member.role,
            "title": member.title,
            "avatar_url": member.avatar_url,
            "groups": assigned_groups,
            "created_at": member.created_at.isoformat() if member.created_at else None
        }
    }

@router.delete("/team/{member_id}")
def delete_team_member(member_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can remove team members")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    member = db.query(models.CompanyMember).filter(
        models.CompanyMember.id == member_id,
        models.CompanyMember.company_id == company.id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Delete the underlying user and member link
    user_to_delete = db.query(models.User).filter(models.User.id == member.user_id).first()
    db.delete(member)
    if user_to_delete:
        db.delete(user_to_delete)
    db.commit()

    return {"message": "Team member removed successfully"}

@router.put("/team/{member_id}")
def update_team_member(
    member_id: int,
    data: schemas.TeamMemberUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can update team members")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    member = db.query(models.CompanyMember).filter(
        models.CompanyMember.id == member_id,
        models.CompanyMember.company_id == company.id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    user_rec = db.query(models.User).filter(models.User.id == member.user_id).first()

    if data.name is not None:
        member.name = data.name.strip()
    if data.title is not None:
        member.title = data.title.strip()
    if data.phone is not None:
        member.phone = data.phone.strip()
    if data.place is not None:
        member.place = data.place.strip()
    if data.avatar_url is not None:
        member.avatar_url = data.avatar_url.strip() if data.avatar_url else None

    if data.role is not None:
        target_role = data.role.upper().strip()
        if target_role in ["RECRUITER", "HIRING_MANAGER"]:
            member.role = target_role
            if user_rec:
                user_rec.role = target_role

    if data.email is not None and user_rec:
        new_email = data.email.strip().lower()
        if new_email != user_rec.email:
            existing = db.query(models.User).filter(models.User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Email '{data.email}' is already in use")
            user_rec.email = new_email

    if data.password is not None and data.password.strip() and user_rec:
        user_rec.password_hash = security.hash_password(data.password.strip())

    if data.group_ids is not None:
        db.query(models.StaffGroupMember).filter(models.StaffGroupMember.member_id == member.id).delete()
        for gid in data.group_ids:
            grp = db.query(models.StaffGroup).filter(
                models.StaffGroup.id == gid,
                models.StaffGroup.company_id == company.id
            ).first()
            if grp:
                db.add(models.StaffGroupMember(group_id=grp.id, member_id=member.id))

    db.commit()
    db.refresh(member)
    if user_rec:
        db.refresh(user_rec)

    # Fetch updated groups
    current_groups = (
        db.query(models.StaffGroup.id, models.StaffGroup.name, models.StaffGroup.department)
        .join(models.StaffGroupMember, models.StaffGroupMember.group_id == models.StaffGroup.id)
        .filter(models.StaffGroupMember.member_id == member.id)
        .all()
    )
    assigned_groups = [{"id": g[0], "name": g[1], "department": g[2]} for g in current_groups]

    return {
        "message": f"Successfully updated staff member {member.name}!",
        "member": {
            "id": member.id,
            "user_id": member.user_id,
            "name": member.name,
            "email": user_rec.email if user_rec else "",
            "role": member.role,
            "title": member.title,
            "phone": member.phone or "",
            "place": member.place or "",
            "avatar_url": member.avatar_url,
            "groups": assigned_groups,
            "created_at": member.created_at.isoformat() if member.created_at else None
        }
    }

# ── Staff KYC & Compliance Documents ──────────────────────────────────────────

@router.get("/staff-documents")
def get_staff_documents(
    member_id: Optional[int] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    query = db.query(models.StaffDocument).filter(models.StaffDocument.company_id == company.id)

    # If recruiter owns the company, allow seeing all company documents
    if user.role == "RECRUITER" and company.user_id == user.id:
        if member_id:
            query = query.filter(models.StaffDocument.member_id == member_id)
    elif user.role in ["RECRUITER", "HIRING_MANAGER"]:
        my_member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first()
        if my_member:
            query = query.filter(models.StaffDocument.member_id == my_member.id)
        else:
            query = query.filter(models.StaffDocument.member_id == None)
    elif member_id:
        query = query.filter(models.StaffDocument.member_id == member_id)

    docs = query.order_by(models.StaffDocument.id.desc()).all()
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "company_id": d.company_id,
            "member_id": d.member_id,
            "member_name": d.member.name if d.member else company.company_name,
            "member_role": d.member.role if d.member else user.role,
            "member_avatar": d.member.avatar_url if d.member else None,
            "member_title": d.member.title if d.member else "Company Document",
            "doc_type": d.doc_type,
            "doc_name": d.doc_name,
            "doc_number": d.doc_number,
            "file_url": d.file_url,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "status": d.status,
            "notes": d.notes,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
        })
    return result

@router.post("/staff-documents", status_code=201)
def upload_staff_document(
    member_id: Optional[int] = Form(None),
    doc_type: str = Form(...),
    doc_name: str = Form(...),
    doc_number: Optional[str] = Form(None),
    status: Optional[str] = Form("VERIFIED"),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    member = None
    if member_id:
        member = db.query(models.CompanyMember).filter(
            models.CompanyMember.id == member_id,
            models.CompanyMember.company_id == company.id
        ).first()

    if not member:
        member = db.query(models.CompanyMember).filter(
            models.CompanyMember.user_id == user.id,
            models.CompanyMember.company_id == company.id
        ).first()

    if not member:
        member = models.CompanyMember(
            company_id=company.id,
            user_id=user.id,
            name=company.company_name,
            role=user.role,
            title="Lead Recruiter / Admin"
        )
        db.add(member)
        db.commit()
        db.refresh(member)

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No document file provided")

    # Upload to AWS S3 folder "resume" (document storage)
    file_url, orig_name = upload_file_to_s3(file=file, folder="resume", entity_id=member_id)

    # Calculate readable file size
    file_size_str = None
    try:
        file.file.seek(0, 2)
        size_bytes = file.file.tell()
        file.file.seek(0)
        if size_bytes < 1024 * 1024:
            file_size_str = f"{size_bytes / 1024:.1f} KB"
        else:
            file_size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
    except Exception:
        file_size_str = "Document"

    doc = models.StaffDocument(
        company_id=company.id,
        member_id=member.id,
        doc_type=doc_type.upper().strip(),
        doc_name=doc_name.strip(),
        doc_number=doc_number.strip() if doc_number else None,
        file_url=file_url,
        file_name=orig_name,
        file_size=file_size_str,
        status=status.upper().strip() if status else "VERIFIED",
        notes=notes.strip() if notes else None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "message": f"Successfully uploaded KYC document '{doc.doc_name}' for {member.name}!",
        "document": {
            "id": doc.id,
            "company_id": doc.company_id,
            "member_id": doc.member_id,
            "member_name": member.name,
            "member_role": member.role,
            "member_avatar": member.avatar_url,
            "member_title": member.title,
            "doc_type": doc.doc_type,
            "doc_name": doc.doc_name,
            "doc_number": doc.doc_number,
            "file_url": doc.file_url,
            "file_name": doc.file_name,
            "file_size": doc.file_size,
            "status": doc.status,
            "notes": doc.notes,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
        }
    }

@router.patch("/staff-documents/{document_id}/status")
def update_staff_document_status(
    document_id: int,
    data: schemas.StaffDocumentStatusUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can verify or reject staff KYC documents")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    doc = db.query(models.StaffDocument).filter(
        models.StaffDocument.id == document_id,
        models.StaffDocument.company_id == company.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Staff document not found")

    new_status = data.status.upper().strip()
    if new_status not in ["VERIFIED", "PENDING", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be VERIFIED, PENDING, or REJECTED")

    doc.status = new_status
    if data.notes is not None:
        doc.notes = data.notes.strip()

    db.commit()
    db.refresh(doc)
    return {"message": f"Document status updated to {new_status}", "status": doc.status, "notes": doc.notes}

@router.delete("/staff-documents/{document_id}")
def delete_staff_document(
    document_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER"]:
        raise HTTPException(status_code=403, detail="Only administrators and recruiters can delete documents")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    doc = db.query(models.StaffDocument).filter(
        models.StaffDocument.id == document_id,
        models.StaffDocument.company_id == company.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Staff document not found")

    db.delete(doc)
    db.commit()
    return {"message": "Staff document removed successfully"}


# ═══════════════════════════════════════════════════════════════════════
#  STAFF GROUPS & PODS MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════

@router.get("/groups")
def get_staff_groups(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    company = get_user_company(user, db)
    if not company:
        return []

    from sqlalchemy import or_
    from app.api.deps import get_user_group_ids

    if user.role != "ADMIN":
        user_group_ids = get_user_group_ids(user, db)
        groups = db.query(models.StaffGroup).filter(
            models.StaffGroup.company_id == company.id,
            or_(
                models.StaffGroup.id.in_(user_group_ids),
                models.StaffGroup.created_by == user.id
            )
        ).order_by(models.StaffGroup.id.asc()).all()
    else:
        groups = db.query(models.StaffGroup).filter(
            models.StaffGroup.company_id == company.id
        ).order_by(models.StaffGroup.id.asc()).all()

    result = []
    for g in groups:
        # Fetch members in this group
        group_members = (
            db.query(models.CompanyMember, models.User.email)
            .join(models.StaffGroupMember, models.StaffGroupMember.member_id == models.CompanyMember.id)
            .outerjoin(models.User, models.User.id == models.CompanyMember.user_id)
            .filter(models.StaffGroupMember.group_id == g.id)
            .all()
        )

        members_list = []
        recruiter_count = 0
        manager_count = 0

        for cm, email in group_members:
            if cm.role == "RECRUITER":
                recruiter_count += 1
            elif cm.role == "HIRING_MANAGER":
                manager_count += 1

            members_list.append({
                "id": cm.id,
                "user_id": cm.user_id,
                "name": cm.name,
                "email": email or "",
                "role": cm.role,
                "title": cm.title or ("Recruiter" if cm.role == "RECRUITER" else "Hiring Manager"),
                "phone": cm.phone or "",
                "place": cm.place or "",
                "avatar_url": cm.avatar_url
            })

        result.append({
            "id": g.id,
            "company_id": g.company_id,
            "name": g.name,
            "description": g.description or "",
            "department": g.department or "General",
            "created_by": g.created_by,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "updated_at": g.updated_at.isoformat() if g.updated_at else None,
            "members": members_list,
            "member_count": len(members_list),
            "recruiter_count": recruiter_count,
            "manager_count": manager_count
        })

    return result


@router.post("/groups", status_code=201)
def create_staff_group(
    data: schemas.StaffGroupCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can create staff groups")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    # Check for duplicate group name in company
    existing = db.query(models.StaffGroup).filter(
        models.StaffGroup.company_id == company.id,
        models.StaffGroup.name.ilike(data.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A group named '{data.name.strip()}' already exists")

    new_group = models.StaffGroup(
        company_id=company.id,
        name=data.name.strip(),
        description=data.description.strip() if data.description else "",
        department=data.department.strip() if data.department else "General",
        created_by=user.id
    )
    db.add(new_group)
    db.flush()

    members_list = []
    recruiter_count = 0
    manager_count = 0

    if data.member_ids:
        valid_members = (
            db.query(models.CompanyMember, models.User.email)
            .outerjoin(models.User, models.User.id == models.CompanyMember.user_id)
            .filter(
                models.CompanyMember.id.in_(data.member_ids),
                models.CompanyMember.company_id == company.id
            )
            .all()
        )

        for cm, email in valid_members:
            db.add(models.StaffGroupMember(group_id=new_group.id, member_id=cm.id))
            if cm.role == "RECRUITER":
                recruiter_count += 1
            elif cm.role == "HIRING_MANAGER":
                manager_count += 1
            members_list.append({
                "id": cm.id,
                "user_id": cm.user_id,
                "name": cm.name,
                "email": email or "",
                "role": cm.role,
                "title": cm.title or ("Recruiter" if cm.role == "RECRUITER" else "Hiring Manager"),
                "phone": cm.phone or "",
                "place": cm.place or "",
                "avatar_url": cm.avatar_url
            })

    db.commit()
    db.refresh(new_group)

    return {
        "message": f"Successfully created staff group '{new_group.name}'!",
        "group": {
            "id": new_group.id,
            "company_id": new_group.company_id,
            "name": new_group.name,
            "description": new_group.description or "",
            "department": new_group.department or "General",
            "created_by": new_group.created_by,
            "created_at": new_group.created_at.isoformat() if new_group.created_at else None,
            "updated_at": new_group.updated_at.isoformat() if new_group.updated_at else None,
            "members": members_list,
            "member_count": len(members_list),
            "recruiter_count": recruiter_count,
            "manager_count": manager_count
        }
    }


@router.put("/groups/{group_id}")
def update_staff_group(
    group_id: int,
    data: schemas.StaffGroupUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can edit staff groups")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    group = db.query(models.StaffGroup).filter(
        models.StaffGroup.id == group_id,
        models.StaffGroup.company_id == company.id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Staff group not found")

    if data.name is not None and data.name.strip():
        if data.name.strip().lower() != group.name.lower():
            existing = db.query(models.StaffGroup).filter(
                models.StaffGroup.company_id == company.id,
                models.StaffGroup.name.ilike(data.name.strip()),
                models.StaffGroup.id != group_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"A group named '{data.name.strip()}' already exists")
        group.name = data.name.strip()

    if data.department is not None:
        group.department = data.department.strip() or "General"
    if data.description is not None:
        group.description = data.description.strip()

    if data.member_ids is not None:
        db.query(models.StaffGroupMember).filter(models.StaffGroupMember.group_id == group.id).delete()
        if data.member_ids:
            valid_mids = [
                m.id for m in db.query(models.CompanyMember.id).filter(
                    models.CompanyMember.id.in_(data.member_ids),
                    models.CompanyMember.company_id == company.id
                ).all()
            ]
            for mid in valid_mids:
                db.add(models.StaffGroupMember(group_id=group.id, member_id=mid))

    db.commit()
    db.refresh(group)

    group_members = (
        db.query(models.CompanyMember, models.User.email)
        .join(models.StaffGroupMember, models.StaffGroupMember.member_id == models.CompanyMember.id)
        .outerjoin(models.User, models.User.id == models.CompanyMember.user_id)
        .filter(models.StaffGroupMember.group_id == group.id)
        .all()
    )

    members_list = []
    recruiter_count = 0
    manager_count = 0
    for cm, email in group_members:
        if cm.role == "RECRUITER":
            recruiter_count += 1
        elif cm.role == "HIRING_MANAGER":
            manager_count += 1
        members_list.append({
            "id": cm.id,
            "user_id": cm.user_id,
            "name": cm.name,
            "email": email or "",
            "role": cm.role,
            "title": cm.title or ("Recruiter" if cm.role == "RECRUITER" else "Hiring Manager"),
            "phone": cm.phone or "",
            "place": cm.place or "",
            "avatar_url": cm.avatar_url
        })

    return {
        "message": f"Updated staff group '{group.name}'",
        "group": {
            "id": group.id,
            "company_id": group.company_id,
            "name": group.name,
            "description": group.description or "",
            "department": group.department or "General",
            "created_by": group.created_by,
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None,
            "members": members_list,
            "member_count": len(members_list),
            "recruiter_count": recruiter_count,
            "manager_count": manager_count
        }
    }


@router.delete("/groups/{group_id}")
def delete_staff_group(
    group_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can delete staff groups")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    group = db.query(models.StaffGroup).filter(
        models.StaffGroup.id == group_id,
        models.StaffGroup.company_id == company.id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Staff group not found")

    group_name = group.name
    db.delete(group)
    db.commit()

    return {"message": f"Staff group '{group_name}' removed successfully"}


@router.post("/groups/{group_id}/members")
def add_members_to_group(
    group_id: int,
    data: schemas.StaffGroupUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can assign group members")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    group = db.query(models.StaffGroup).filter(
        models.StaffGroup.id == group_id,
        models.StaffGroup.company_id == company.id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Staff group not found")

    if data.member_ids:
        existing_mids = set(
            db.query(models.StaffGroupMember.member_id)
            .filter(models.StaffGroupMember.group_id == group.id)
            .scalars()
            .all()
        )
        valid_mids = [
            m.id for m in db.query(models.CompanyMember.id).filter(
                models.CompanyMember.id.in_(data.member_ids),
                models.CompanyMember.company_id == company.id
            ).all()
        ]
        for mid in valid_mids:
            if mid not in existing_mids:
                db.add(models.StaffGroupMember(group_id=group.id, member_id=mid))
        db.commit()

    return {"message": "Group members updated successfully"}


@router.delete("/groups/{group_id}/members/{member_id}")
def remove_member_from_group(
    group_id: int,
    member_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can remove group members")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    group = db.query(models.StaffGroup).filter(
        models.StaffGroup.id == group_id,
        models.StaffGroup.company_id == company.id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Staff group not found")

    deleted = (
        db.query(models.StaffGroupMember)
        .filter(
            models.StaffGroupMember.group_id == group.id,
            models.StaffGroupMember.member_id == member_id
        )
        .delete()
    )
    db.commit()

    if not deleted:
        raise HTTPException(status_code=404, detail="Member was not in this group")

    return {"message": "Member removed from group successfully"}


