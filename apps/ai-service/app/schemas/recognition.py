from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RecognitionOptions(BaseModel):
    detectMultipleContours: bool = True
    allowedSegmentKinds: list[Literal["line"]] = Field(default_factory=lambda: ["line"], min_length=1)
    targetUnit: Literal["mm"] = "mm"


class AiRecognitionRequest(BaseModel):
    jobId: str = Field(min_length=1)
    drawingId: str = Field(min_length=1)
    imagePath: str = Field(min_length=1)
    options: RecognitionOptions = Field(default_factory=RecognitionOptions)


class AiRecognitionResponse(BaseModel):
    jobId: str
    status: Literal["completed", "failed"]
    resultPayload: dict[str, Any] | None = None
    debugPayload: dict[str, Any] | None = None
