from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="Lumina AI Cognition", version="2.0.0")
app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-cognition"}
