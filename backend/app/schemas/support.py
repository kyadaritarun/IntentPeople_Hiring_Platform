from pydantic import BaseModel

class SupportTicketCreate(BaseModel):
    subject: str
    category: str
    message: str
