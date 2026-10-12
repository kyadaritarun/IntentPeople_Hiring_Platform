from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InternalMessageCreate(BaseModel):
    channel: Optional[str] = "team-sync"
    content: Optional[str] = ""
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class InternalMessageOut(BaseModel):
    id: int
    company_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    channel: str
    content: Optional[str] = ""
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
