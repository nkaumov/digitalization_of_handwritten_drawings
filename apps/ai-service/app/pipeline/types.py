from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, List, Literal, TypedDict

from app.pipeline.contracts import (
    DebugArtifact,
    PipelineContext,
    PipelineRuntimeContext,
    PipelineWarning,
    StageNote,
)
from app.pipeline.stage_names import PipelineStageName


PipelineStageContext = PipelineContext
PipelineHookName = Literal[
    "before-pipeline-run",
    "after-pipeline-run",
    "before-stage-run",
    "after-stage-run",
    "on-stage-error",
]


class PipelineStageInput(TypedDict, total=False):
    stage: PipelineStageName
    context: PipelineStageContext
    runtime: PipelineRuntimeContext


class PipelineStageOutput(TypedDict, total=False):
    context: PipelineStageContext
    warnings: List[PipelineWarning]
    stage_notes: List[StageNote]
    debug_artifacts: List[DebugArtifact]


class PipelineHookContext(TypedDict, total=False):
    hook: PipelineHookName
    chain_id: str
    run_id: str
    stage: PipelineStageName
    stage_index: int
    stage_count: int
    triggered_by: str
    continue_on_stage_failure: bool
    context: PipelineStageContext
    error: "PipelineStageError"
    meta: dict[str, str]


PipelineHookHandler = Callable[[PipelineHookContext], None | PipelineHookContext]
StageHandler = Callable[[PipelineStageInput], PipelineStageOutput]


@dataclass(frozen=True)
class PipelineStageError:
    chain_id: str
    stage: PipelineStageName
    message: str
    safe_failure: bool = True
    details: str | None = None


@dataclass(frozen=True)
class PipelineStageResult:
    context: PipelineStageContext
    chain_id: str
    started_at_iso: str
    finished_at_iso: str
    duration_ms: int
    aborted_by_policy: bool = False
    completed_stages: List[PipelineStageName] = field(default_factory=list)
    errors: List[PipelineStageError] = field(default_factory=list)
