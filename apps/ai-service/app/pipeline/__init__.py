"""Pipeline package for staged recognition flow."""

from app.pipeline.contracts import (
    DebugArtifact,
    DrawingPayloadDraft,
    PipelineContext,
    PipelineWarning,
    StageNote,
)
from app.pipeline.manager import PipelineManager
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.runner import PipelineRunner
from app.pipeline.stage_names import PipelineStageName
from app.pipeline.types import (
    PipelineStageError,
    PipelineStageInput,
    PipelineStageOutput,
    PipelineStageResult,
    StageHandler,
)

__all__ = [
    "PipelineManager",
    "PipelineRunner",
    "PipelineStageRegistry",
    "PipelineStageName",
    "PipelineContext",
    "PipelineWarning",
    "StageNote",
    "DebugArtifact",
    "DrawingPayloadDraft",
    "PipelineStageInput",
    "PipelineStageOutput",
    "PipelineStageResult",
    "PipelineStageError",
    "StageHandler",
]