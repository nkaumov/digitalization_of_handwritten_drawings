"""Pipeline package for staged recognition flow."""

from app.pipeline.manager import PipelineManager
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.runner import PipelineRunner
from app.pipeline.types import (
    PipelineStageContext,
    PipelineStageError,
    PipelineStageName,
    PipelineStageResult,
    StageHandler,
)

__all__ = [
    "PipelineManager",
    "PipelineRunner",
    "PipelineStageRegistry",
    "PipelineStageName",
    "PipelineStageContext",
    "PipelineStageResult",
    "PipelineStageError",
    "StageHandler",
]