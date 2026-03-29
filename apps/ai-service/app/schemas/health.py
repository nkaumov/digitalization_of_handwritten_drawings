from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    ok: bool
    service: str
    env: str
    timestamp: datetime