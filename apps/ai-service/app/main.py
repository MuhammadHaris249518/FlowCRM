from fastapi import FastAPI
from app.routers import scoring, email_draft, assistant

app = FastAPI(title="FlowCRM AI Service")

app.include_router(scoring.router)
app.include_router(email_draft.router)
app.include_router(assistant.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
