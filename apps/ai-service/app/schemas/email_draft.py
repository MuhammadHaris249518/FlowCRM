from typing import Optional
from pydantic import BaseModel, Field


class EmailDraftContext(BaseModel):
    """Context passed to the LLM for personalization. This intentionally
    does NOT follow the lead-scoring boolean-signal pattern (hasEmail,
    hasPhone) — drafting a real email requires real content like the
    contact's name. Node is still responsible for org-scoping this data
    before it ever reaches this service."""
    contactName: Optional[str] = None
    companyName: Optional[str] = None
    leadStatus: Optional[str] = None
    leadSource: Optional[str] = None
    dealStage: Optional[str] = None
    dealTitle: Optional[str] = None
    notes: Optional[str] = None


class EmailDraftRequest(BaseModel):
    instructions: str = Field(
        ..., min_length=1, max_length=2000,
        description="From the ACTION_AI workflow node's config.instructions field.",
    )
    context: EmailDraftContext = EmailDraftContext()


class EmailDraftJobCreated(BaseModel):
    jobId: str
    status: str  # "pending"


class EmailDraftResult(BaseModel):
    subject: str
    body: str
    revisionCount: int
    finalFeedback: str


class EmailDraftJobStatus(BaseModel):
    jobId: str
    status: str  # pending | running | completed | failed
    result: Optional[EmailDraftResult] = None
    error: Optional[str] = None
