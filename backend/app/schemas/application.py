from pydantic import BaseModel
from typing import Optional

class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = ""

class ApplicationStatusUpdate(BaseModel):
    status: str
