"""
In-memory job store for async AI actions (e.g. email drafting).

KNOWN LIMITATION — deliberate MVP simplification, not an oversight:
this store is a plain process-local dict. It does not survive a service
restart and will not work correctly if ai-service is ever run with more
than one uvicorn worker process, since each worker gets its own copy.
Fine for local dev and a single-worker deployment. If ai-service is later
scaled to multiple workers, replace this with a shared store (Redis, or
a table Node already owns) — do not paper over it with sticky sessions.
"""
import threading
import uuid
from datetime import datetime, timezone
from typing import Optional

_lock = threading.Lock()
_jobs: dict[str, dict] = {}


def create_job() -> str:
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        _jobs[job_id] = {
            "jobId": job_id,
            "status": "pending",
            "result": None,
            "error": None,
            "createdAt": now,
            "updatedAt": now,
        }
    return job_id


def update_job(job_id: str, **fields) -> None:
    with _lock:
        if job_id not in _jobs:
            return
        _jobs[job_id].update(fields)
        _jobs[job_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()


def get_job(job_id: str) -> Optional[dict]:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None
