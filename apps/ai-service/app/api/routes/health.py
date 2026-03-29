from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        ok=True,
        service="ai-service",
        env=settings.env,
        timestamp=datetime.now(timezone.utc),
    )