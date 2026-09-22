from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db, SessionLocal
from app import models, schemas
from app.api.deps import get_current_user, get_user_company
from app.core import security

router = APIRouter(prefix="/messages", tags=["Internal Staff Messages"])


# ── Real-time In-Memory Connection Manager ──────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # Maps company_id -> list of active client dicts: {"ws": WebSocket, "user_id": int, "role": str}
        self.active_connections: dict[int, list[dict]] = {}

    async def connect(self, websocket: WebSocket, company_id: int, user_id: int, role: str):
        await websocket.accept()
        if company_id not in self.active_connections:
            self.active_connections[company_id] = []
        self.active_connections[company_id].append({
            "ws": websocket,
            "user_id": user_id,
            "role": role
        })

    def disconnect(self, websocket: WebSocket, company_id: int):
        if company_id in self.active_connections:
            self.active_connections[company_id] = [
                c for c in self.active_connections[company_id] if c["ws"] != websocket
            ]
            if not self.active_connections[company_id]:
                del self.active_connections[company_id]

    async def broadcast_to_company(self, company_id: int, payload: dict):
        if company_id not in self.active_connections:
            return
        dead = []
        for conn in self.active_connections[company_id]:
            try:
                await conn["ws"].send_json(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            if d in self.active_connections[company_id]:
                self.active_connections[company_id].remove(d)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_internal_messages(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Real-time WebSocket endpoint for internal staff messages.
    Strictly authenticates staff (ADMIN, RECRUITER, HIRING_MANAGER).
    Automatically binds client to their company_id.
    Zero candidate access or cross-company leakage.
    Uses short-lived database sessions to prevent connection pool starvation.
    """
    if not token:
        await websocket.close(code=4001, reason="Authentication token required")
        return

    payload = security.decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4002, reason="Invalid authentication token")
        return

    try:
        user_id = int(payload["sub"])
    except Exception:
        await websocket.close(code=4002, reason="Invalid token user identity")
        return

    # Authenticate and resolve company in a short-lived DB session
    auth_db = SessionLocal()
    try:
        user = auth_db.query(models.User).filter(models.User.id == user_id).first()
        if not user or user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
            await websocket.close(code=4003, reason="Forbidden: Staff only")
            return

        company = get_user_company(user, auth_db)
        if not company:
            await websocket.close(code=4004, reason="Organization profile not found")
            return

        company_id = company.id
        company_name = company.company_name
        user_role = user.role
        user_email = user.email
    finally:
        auth_db.close()

    await manager.connect(websocket, company_id, user_id, user_role)
    try:
        # Acknowledge connection
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "company_id": company_id,
            "company_name": company_name,
            "user_id": user_id,
            "role": user_role,
            "timestamp": datetime.utcnow().isoformat()
        })

        while True:
            data = await websocket.receive_json()
            action = data.get("type", "SEND_MESSAGE")

            if action == "SEND_MESSAGE":
                content = (data.get("content") or "").strip()
                channel = (data.get("channel") or "team-sync").strip()
                if content:
                    msg_db = SessionLocal()
                    try:
                        sender_name = "Staff Member"
                        if user_role == "ADMIN":
                            sender_name = f"{company_name} Administrator" if company_name else "Administrator"
                        else:
                            member = msg_db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user_id).first()
                            if member and member.name:
                                sender_name = member.name
                            else:
                                sender_name = user_email.split("@")[0]

                        msg = models.InternalMessage(
                            company_id=company_id,
                            sender_id=user_id,
                            sender_name=sender_name,
                            sender_role=user_role,
                            channel=channel,
                            content=content
                        )
                        msg_db.add(msg)
                        msg_db.commit()
                        msg_db.refresh(msg)

                        msg_dict = {
                            "id": msg.id,
                            "company_id": msg.company_id,
                            "sender_id": msg.sender_id,
                            "sender_name": msg.sender_name,
                            "sender_role": msg.sender_role,
                            "channel": msg.channel,
                            "content": msg.content,
                            "created_at": msg.created_at.isoformat() if msg.created_at else None
                        }
                    finally:
                        msg_db.close()

                    broadcast_payload = {
                        "type": "NEW_MESSAGE",
                        "message": msg_dict
                    }
                    await manager.broadcast_to_company(company_id, broadcast_payload)
            elif action == "PING":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, company_id)
    except Exception:
        manager.disconnect(websocket, company_id)


@router.get("")
def get_internal_messages(
    channel: Optional[str] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List internal organization messages.
    STRICTLY RESTRICTED: Only ADMIN, RECRUITER, HIRING_MANAGER can access.
    STRICT MULTI-TENANT ISOLATION: Filtered exclusively by the user's company_id.
    Zero data is ever accessible to candidates or other organizations.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(
            status_code=403, 
            detail="Access restricted: Only internal organization staff can access workspace messages"
        )

    company = get_user_company(user, db)
    if not company:
        return []

    query = db.query(models.InternalMessage).filter(models.InternalMessage.company_id == company.id)
    if channel and channel.strip():
        query = query.filter(models.InternalMessage.channel == channel.strip())

    messages = query.order_by(models.InternalMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "company_id": m.company_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender_name,
            "sender_role": m.sender_role,
            "channel": m.channel,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("")
async def send_internal_message(
    data: schemas.message.InternalMessageCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send an internal workspace message.
    STRICTLY RESTRICTED: Only ADMIN, RECRUITER, HIRING_MANAGER can send messages.
    Automatically bound to the sender's company_id.
    Broadcasts in real-time via WebSocket to connected company staff.
    """
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(
            status_code=403, 
            detail="Access restricted: Only internal organization staff can send workspace messages"
        )

    if not data.content or not data.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    company = get_user_company(user, db)
    if not company:
        raise HTTPException(status_code=400, detail="No active organization profile found for this staff user")

    # Determine display name
    sender_name = "Staff Member"
    if user.role == "ADMIN":
        sender_name = f"{company.company_name} Administrator" if company.company_name else "Administrator"
    else:
        member = db.query(models.CompanyMember).filter(models.CompanyMember.user_id == user.id).first()
        if member and member.name:
            sender_name = member.name
        else:
            sender_name = user.email.split("@")[0]

    msg = models.InternalMessage(
        company_id=company.id,
        sender_id=user.id,
        sender_name=sender_name,
        sender_role=user.role,
        channel=(data.channel or "team-sync").strip(),
        content=data.content.strip()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    response_payload = {
        "id": msg.id,
        "company_id": msg.company_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "channel": msg.channel,
        "content": msg.content,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }

    # Broadcast in real-time to all colleagues active in this company
    await manager.broadcast_to_company(company.id, {
        "type": "NEW_MESSAGE",
        "message": response_payload
    })

    return response_payload

