"""Pipeline package for staged recognition flow."""

from app.pipeline.contracts import (
    DebugArtifact,
    DrawingPayloadDraft,
    PipelineContext,
    PipelineRuntimeContext,
    PipelineWarning,
    StageNote,
)
from app.pipeline.hooks import PipelineHookManager, PipelineHookRegistration
from app.pipeline.hooks_registry import build_placeholder_hook_manager
from app.pipeline.manager import PipelineManager
from app.pipeline.registry import PipelineStageDescriptor, PipelineStageRegistration, PipelineStageRegistry
from app.pipeline.runner import PipelineRunner
from app.pipeline.stage_names import PipelineStageName
from app.pipeline.types import (
    PipelineHookContext,
    PipelineHookHandler,
    PipelineHookName,
    PipelineStageError,
    PipelineStageContext,
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
    "PipelineRuntimeContext",
    "PipelineHookName",
    "PipelineHookContext",
    "PipelineHookHandler",
    "PipelineHookManager",
    "PipelineHookRegistration",
    "build_placeholder_hook_manager",
    "PipelineStageRegistration",
    "PipelineStageDescriptor",
    "PipelineStageContext",
    "PipelineStageInput",
    "PipelineStageOutput",
    "PipelineStageResult",
    "PipelineStageError",
    "StageHandler",
]
