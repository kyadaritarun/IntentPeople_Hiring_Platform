from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == user.id).order_by(models.Notification.id.desc()).all()
    return [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None
    } for n in notifs]

@router.delete("/clear")
def clear_all_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.user_id == user.id).delete()
    db.commit()
    return {"message": "All notifications cleared"}

@router.delete("/{notification_id}")
def delete_single_notification(notification_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user.id
    ).first()
    if notif:
        db.delete(notif)
        db.commit()
    return {"message": "Notification removed"}
