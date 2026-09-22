from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.api.deps import get_current_user

router = APIRouter(prefix="/support", tags=["Support Tickets"])

@router.get("/tickets")
def get_support_tickets(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "ADMIN":
        tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).all()
    else:
        tickets = db.query(models.SupportTicket).filter(models.SupportTicket.user_id == user.id).order_by(models.SupportTicket.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "subject": t.subject,
            "category": t.category,
            "message": t.message,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in tickets
    ]

@router.post("/tickets", status_code=201)
def create_support_ticket(data: schemas.SupportTicketCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = models.SupportTicket(
        user_id=user.id,
        subject=data.subject,
        category=data.category,
        message=data.message,
        status="OPEN"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {
        "message": "Support ticket raised successfully! Our team will respond within 24 hours.",
        "ticket": {
            "id": ticket.id,
            "subject": ticket.subject,
            "category": ticket.category,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None
        }
    }

