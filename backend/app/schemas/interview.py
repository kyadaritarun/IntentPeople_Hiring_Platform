from pydantic import BaseModel
from typing import Optional

class InterviewCreate(BaseModel):
    application_id: Optional[int] = None
    job_title: str
    candidate_name: str = "Candidate"
    interviewer_name: Optional[str] = None
    interview_date: str
    interview_time: Optional[str] = None
    duration: str = "45 mins"
    round: Optional[str] = None
    mode: str = "Google Meet"
    meet_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "CONFIRMED"

class InterviewUpdate(BaseModel):
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    meet_url: Optional[str] = None
