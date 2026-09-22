from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InternalMessageCreate(BaseModel):
    channel: Optional[str] = "team-sync"
    content: str

class InternalMessageOut(BaseModel):
    id: int
    company_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    channel: str
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
