from fastapi import FastAPI

from app.schemas.common import HealthResponse
from app.settings import settings

app = FastAPI(
    title="Revival Control API",
    version="0.1.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(service="revival-control-api", status="ok", version="0.1.0")
