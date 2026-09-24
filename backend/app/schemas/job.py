from pydantic import BaseModel
from typing import Optional, List, Any

class JobCreate(BaseModel):
    title: str
    description: str
    skills: List[str]
    experience_level: Optional[str] = "Mid Level"
    ownership_level: Optional[str] = None
    specialization: Optional[str] = None
    must_have_capabilities: Optional[str] = None
    preferred_capabilities: Optional[str] = None
    availability_requirement: Optional[str] = None
    min_experience: Optional[str] = "1 year"
    salary_min: Optional[int] = 0
    salary_max: Optional[int] = 0
    salary_currency: Optional[str] = "USD"
    location: str
    work_mode: str
    job_type: str
    product_service: Optional[str] = None
    business_model: Optional[str] = None
    growth_stage: Optional[str] = None
    target_audience: Optional[str] = None
    ideal_customer_profile: Optional[str] = None
    business_problem: Optional[str] = None
    expected_outcome: Optional[str] = None
    team_support: Optional[str] = None
    monthly_budget_range: Optional[str] = None
    decision_authority: Optional[str] = None
    success_horizon: Optional[str] = None
    screening_questions: Optional[List[Any]] = None

class JobStatusUpdate(BaseModel):
    status: str

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    ownership_level: Optional[str] = None
    specialization: Optional[str] = None
    must_have_capabilities: Optional[str] = None
    preferred_capabilities: Optional[str] = None
    availability_requirement: Optional[str] = None
    min_experience: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    job_type: Optional[str] = None
    product_service: Optional[str] = None
    business_model: Optional[str] = None
    growth_stage: Optional[str] = None
    target_audience: Optional[str] = None
    ideal_customer_profile: Optional[str] = None
    business_problem: Optional[str] = None
    expected_outcome: Optional[str] = None
    team_support: Optional[str] = None
    monthly_budget_range: Optional[str] = None
    decision_authority: Optional[str] = None
    success_horizon: Optional[str] = None
    screening_questions: Optional[List[Any]] = None

