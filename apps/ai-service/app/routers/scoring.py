from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.schemas.scoring import ScoreLeadRequest, ScoreLeadResponse
from app.services.groq_client import score_lead

router = APIRouter()


@router.post(
    "/score-lead",
    response_model=ScoreLeadResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def score_lead_endpoint(payload: ScoreLeadRequest):
    result = score_lead(payload)
    return ScoreLeadResponse(**result)
