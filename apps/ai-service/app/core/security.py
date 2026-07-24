from fastapi import Header, HTTPException
from app.core.config import INTERNAL_SERVICE_KEY


async def verify_internal_key(x_internal_service_key: str = Header(...)):
    # This service is never exposed publicly — Node is the only caller,
    # authenticating with a shared secret rather than a second Clerk
    # integration. See docs/api/ai-service.md for the rationale.
    if x_internal_service_key != INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal service key")
