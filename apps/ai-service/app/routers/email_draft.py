import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_internal_key
from app.schemas.email_draft import (
    EmailDraftJobCreated,
    EmailDraftJobStatus,
    EmailDraftRequest,
    EmailDraftResult,
)
from app.services import job_store
from app.services.email_draft_graph import run_email_draft

router = APIRouter()
logger = logging.getLogger("ai-service.email_draft")


async def _execute_job(job_id: str, payload: EmailDraftRequest) -> None:
    job_store.update_job(job_id, status="running")
    try:
        result = await asyncio.to_thread(
            run_email_draft, payload.instructions, payload.context.model_dump()
        )
        job_store.update_job(job_id, status="completed", result=result)
    except Exception as exc:  # noqa: BLE001 — background task boundary, must not raise
        logger.exception("email draft job %s failed", job_id)
        job_store.update_job(job_id, status="failed", error=str(exc))


@router.post(
    "/email/draft",
    response_model=EmailDraftJobCreated,
    status_code=202,
    dependencies=[Depends(verify_internal_key)],
)
async def create_email_draft(payload: EmailDraftRequest):
    job_id = job_store.create_job()
    asyncio.create_task(_execute_job(job_id, payload))
    return EmailDraftJobCreated(jobId=job_id, status="pending")


@router.get(
    "/email/draft/{job_id}",
    response_model=EmailDraftJobStatus,
    dependencies=[Depends(verify_internal_key)],
)
async def get_email_draft_status(job_id: str):
    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    result = EmailDraftResult(**job["result"]) if job.get("result") else None
    return EmailDraftJobStatus(
        jobId=job["jobId"],
        status=job["status"],
        result=result,
        error=job.get("error"),
    )
