from fastapi import FastAPI
from app.routers import scoring

app = FastAPI(title="FlowCRM AI Service")

app.include_router(scoring.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
