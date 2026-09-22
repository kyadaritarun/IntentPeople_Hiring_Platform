from pydantic import BaseModel
from typing import Optional, List

class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    place: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    experience: Optional[List[dict]] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    expertise: Optional[List[str]] = None
    hiring_preferences: Optional[dict] = None
