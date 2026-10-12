from pydantic import BaseModel
from typing import Optional

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    primary_industry: Optional[str] = None
    sub_industry: Optional[str] = None
    organisation_type: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    headquarters_location: Optional[str] = None
    other_locations: Optional[str] = None
    linkedin_url: Optional[str] = None
    year_founded: Optional[str] = None
    about: Optional[str] = None
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
    business_model_data: Optional[dict] = None
    target_audience_data: Optional[dict] = None
    growth_stage_data: Optional[dict] = None
    marketing_team_data: Optional[dict] = None
    hiring_defaults_data: Optional[dict] = None
    compliance_documents_data: Optional[dict] = None

class MemberProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    place: Optional[str] = None
    title: Optional[str] = None
    avatar_url: Optional[str] = None

class TeamMemberCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str  # 'RECRUITER' or 'HIRING_MANAGER'
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    group_ids: Optional[list[int]] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None  # 'RECRUITER' or 'HIRING_MANAGER'
    title: Optional[str] = None
    phone: Optional[str] = None
    place: Optional[str] = None
    avatar_url: Optional[str] = None
    group_ids: Optional[list[int]] = None

class StaffGroupCreate(BaseModel):
    name: str
    department: Optional[str] = "General"
    description: Optional[str] = None
    member_ids: Optional[list[int]] = []

class StaffGroupUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    member_ids: Optional[list[int]] = None

class StaffDocumentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
