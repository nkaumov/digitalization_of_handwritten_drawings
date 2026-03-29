from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Literal, TypedDict

PipelineStageName = Literal[
    "normalize-image",
    "detect-lines",
    "detect-text",
    "parse-dimensions",
    "build-graph",
    "find-contours",
    "normalize-units",
    "assemble-result",
]


class PipelineStageContext(TypedDict, total=False):
    image_path: str
    stages: List[str]
    warnings: List[str]
    payload: Dict[str, Any]
    meta: Dict[str, Any]


StageHandler = Callable[[PipelineStageContext], PipelineStageContext]


@dataclass(frozen=True)
class PipelineStageError:
    stage: PipelineStageName
    message: str
    details: str | None = None


@dataclass(frozen=True)
class PipelineStageResult:
    context: PipelineStageContext
    completed_stages: List[PipelineStageName] = field(default_factory=list)
    errors: List[PipelineStageError] = field(default_factory=list)