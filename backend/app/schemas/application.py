from pydantic import BaseModel
from typing import Optional, List, Any

class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = ""
    screening_answers: Optional[List[Any]] = []

class ApplicationStatusUpdate(BaseModel):
    status: str
