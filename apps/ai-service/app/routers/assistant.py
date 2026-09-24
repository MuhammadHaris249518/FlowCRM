from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_chat import run_assistant_turn

router = APIRouter()


@router.post(
    "/assistant/chat",
    response_model=AssistantChatResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def assistant_chat(payload: AssistantChatRequest):
    return run_assistant_turn(payload)
