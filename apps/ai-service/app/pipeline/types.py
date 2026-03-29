from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, List, TypedDict

from app.pipeline.contracts import DebugArtifact, PipelineContext, PipelineWarning, StageNote
from app.pipeline.stage_names import PipelineStageName


class PipelineStageInput(TypedDict):
    stage: PipelineStageName
    context: PipelineContext


class PipelineStageOutput(TypedDict, total=False):
    context: PipelineContext
    warnings: List[PipelineWarning]
    stage_notes: List[StageNote]
    debug_artifacts: List[DebugArtifact]


StageHandler = Callable[[PipelineStageInput], PipelineStageOutput]


@dataclass(frozen=True)
class PipelineStageError:
    stage: PipelineStageName
    message: str
    details: str | None = None


@dataclass(frozen=True)
class PipelineStageResult:
    context: PipelineContext
    completed_stages: List[PipelineStageName] = field(default_factory=list)
    errors: List[PipelineStageError] = field(default_factory=list)