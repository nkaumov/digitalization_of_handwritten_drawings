from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.recognition import router as recognition_router
from app.core.config import settings
from app.core.logger import configure_logging, get_logger

configure_logging(settings.log_level)
logger = get_logger(__name__)

app = FastAPI(title=settings.title)
app.include_router(health_router)
app.include_router(recognition_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info(
        "AI service started",
        extra={"env": settings.env, "host": settings.host, "port": settings.port},
    )
