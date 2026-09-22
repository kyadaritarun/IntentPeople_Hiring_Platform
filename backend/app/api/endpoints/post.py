from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db, engine, Base
from app import models
from app.api.deps import get_current_user
from app.services.s3 import upload_file_to_s3

# Ensure portal_posts & portal_post_comments tables exist
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/posts", tags=["posts"])

class PostCreate(BaseModel):
    content: str
    tags: Optional[List[str]] = []
    image_url: Optional[str] = None

class PostUpdate(BaseModel):
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

from urllib.parse import quote_plus

def format_author(user: Optional[models.User], user_id: int, db: Session):
    cand = db.query(models.Candidate).filter(models.Candidate.user_id == user_id).first() if user_id else None
    member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user_id).first() if user_id else None
    company = db.query(models.Company).filter(models.Company.user_id == user_id).first() if user_id else None

    comp = member.company if (member and member.company) else company

    author_name = "Member"
    author_avatar = None
    author_title = "Member"
    role = user.role if user else ("CANDIDATE" if cand else ("RECRUITER" if member else "CANDIDATE"))

    if cand:
        author_name = cand.full_name or (user.email.split('@')[0] if user else 'Candidate')
        author_avatar = cand.avatar_url
        author_title = cand.title or "Candidate"
        role = "CANDIDATE"
    elif member:
        author_name = member.name or (user.email.split('@')[0] if user else 'Recruiter')
        author_avatar = member.avatar_url or (comp.logo_url if comp else None)
        author_title = member.title or (member.role.replace('_', ' ').title() if member.role else "Recruiter")
        role = member.role or (user.role if user else "RECRUITER")
    elif comp:
        author_name = comp.company_name or (user.email.split('@')[0] if user else 'Employer')
        author_avatar = comp.logo_url
        author_title = comp.industry or "Hiring Organization"
        role = user.role if user else "RECRUITER"
    elif user:
        author_name = user.email.split('@')[0]
        author_title = user.role.capitalize() if user.role else "Member"
        role = user.role

    # Fallback to high-quality avatar if no photo uploaded
    if not author_avatar:
        safe_name = quote_plus(author_name or "Member")
        bg_color = "065f46" if role in ["RECRUITER", "HIRING_MANAGER", "ADMIN"] else "1E3155"
        author_avatar = f"https://ui-avatars.com/api/?name={safe_name}&background={bg_color}&color=ffffff&size=150&bold=true"

    return {
        "name": author_name,
        "avatar": author_avatar,
        "title": author_title,
        "role": role,
        "candidate_id": cand.id if cand else None,
        "company_id": comp.id if comp else None,
        "skills": cand.skills if cand else [],
        "city": cand.city if cand else (member.place if member else (comp.location if comp else None)),
        "state": cand.state if cand else None,
        "summary": cand.summary if cand else (comp.about if comp else None),
        "portfolio_url": cand.portfolio_url if cand else (comp.website if comp else None),
        "email": user.email if user else None
    }

def format_comment(comment: models.PostComment, db: Session):
    author = format_author(comment.user, comment.user_id, db)
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "author": author
    }

def format_post(post: models.Post, db: Session):
    author = format_author(post.user, post.user_id, db)
    comments_list = [format_comment(c, db) for c in (post.comments or [])]

    return {
        "id": post.id,
        "user_id": post.user_id,
        "content": post.content,
        "image_url": post.image_url,
        "tags": post.tags or [],
        "likes_count": post.likes_count or 0,
        "views_count": post.views_count or 0,
        "comments_count": len(comments_list),
        "comments": comments_list,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
        "author": author
    }

@router.get("/my")
def get_my_posts(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(models.Post).filter(models.Post.user_id == user.id).order_by(models.Post.created_at.desc()).all()
    return [format_post(p, db) for p in posts]

@router.get("/")
def get_community_posts(
    author_role: Optional[str] = Query(None, description="Filter by CANDIDATE, RECRUITER, or HIRING_MANAGER"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = 60,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Post).join(models.User, models.Post.user_id == models.User.id)
    if author_role:
        query = query.filter(models.User.role == author_role.upper())

    posts = query.order_by(models.Post.created_at.desc()).limit(limit).all()

    formatted = [format_post(p, db) for p in posts]
    if tag:
        clean_tag = tag.lower().strip()
        formatted = [p for p in formatted if any(clean_tag in t.lower() for t in p.get("tags", []))]

    return formatted

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Post content cannot be empty")

    clean_tags = []
    for t in (payload.tags or []):
        t_clean = t.strip()
        if t_clean:
            if not t_clean.startswith("#"):
                t_clean = f"#{t_clean}"
            clean_tags.append(t_clean)

    post = models.Post(
        user_id=user.id,
        content=payload.content.strip(),
        image_url=payload.image_url.strip() if payload.image_url else None,
        tags=clean_tags,
        likes_count=0,
        views_count=1
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return format_post(post, db)

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this post")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully", "deleted_id": post_id}

@router.put("/{post_id}")
def update_post(
    post_id: int,
    payload: PostUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this post")

    if payload.content is not None:
        content_clean = payload.content.strip()
        if not content_clean:
            raise HTTPException(status_code=400, detail="Post content cannot be empty")
        post.content = content_clean

    if payload.tags is not None:
        clean_tags = []
        for t in payload.tags:
            t_clean = t.strip()
            if t_clean:
                if not t_clean.startswith("#"):
                    t_clean = f"#{t_clean}"
                clean_tags.append(t_clean)
        post.tags = clean_tags

    if payload.image_url is not None:
        post.image_url = payload.image_url.strip() if payload.image_url else None

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return format_post(post, db)

@router.post("/{post_id}/like")
def toggle_like_post(
    post_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.likes_count = (post.likes_count or 0) + 1
    db.commit()
    db.refresh(post)
    return {"likes_count": post.likes_count}

@router.post("/{post_id}/comments")
def add_post_comment(
    post_id: int,
    payload: CommentCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = models.PostComment(
        post_id=post_id,
        user_id=user.id,
        content=payload.content.strip()
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return format_comment(comment, db)

@router.delete("/{post_id}/comments/{comment_id}")
def delete_post_comment(
    post_id: int,
    comment_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.PostComment).filter(
        models.PostComment.id == comment_id,
        models.PostComment.post_id == post_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully", "deleted_id": comment_id}

@router.post("/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    file_url, _ = upload_file_to_s3(file=file, folder="image", entity_id=user.id)
    return {
        "message": "Post image uploaded successfully",
        "image_url": file_url
    }
