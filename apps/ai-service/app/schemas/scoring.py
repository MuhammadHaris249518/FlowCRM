from typing import Optional
from pydantic import BaseModel


class ContactSignals(BaseModel):
    hasFullName: bool
    hasEmail: bool
    hasPhone: bool
    companyName: Optional[str] = None
    companyDomain: Optional[str] = None


class ScoreLeadRequest(BaseModel):
    source: Optional[str] = None
    notes: Optional[str] = None
    status: str
    daysSinceCreated: int
    contact: Optional[ContactSignals] = None


class ScoreLeadResponse(BaseModel):
    score: int
    reasoning: str
