from __future__ import annotations

from typing import Any, Dict, List, Literal, TypedDict

from app.pipeline.stage_names import PipelineStageName

WarningLevel = Literal["info", "warning", "error"]
StageNoteLevel = Literal["info", "warning", "error"]


class PipelineWarning(TypedDict, total=False):
    code: str
    message: str
    level: WarningLevel
    stage: PipelineStageName


class StageNote(TypedDict, total=False):
    stage: PipelineStageName
    message: str
    level: StageNoteLevel


DebugArtifactKind = Literal[
    "normalized-image",
    "detected-lines",
    "detected-text",
    "parsed-dimensions",
    "graph",
    "contours",
    "normalized-units",
    "assembled-result",
    "generic",
]


class DebugArtifact(TypedDict, total=False):
    kind: DebugArtifactKind
    stage: PipelineStageName
    path: str
    meta: Dict[str, Any]


class DrawingPayloadDraft(TypedDict, total=False):
    version: str
    drawingId: str
    unit: Literal["mm"]
    contours: List[Dict[str, Any]]
    warnings: List[PipelineWarning]
    confidence: float | None


class PipelineContext(TypedDict, total=False):
    image_path: str
    drawing_id: str
    target_unit: Literal["mm"]
    payload: DrawingPayloadDraft
    warnings: List[PipelineWarning]
    stage_notes: List[StageNote]
    debug_artifacts: List[DebugArtifact]
    stage_trace: List[PipelineStageName]
    meta: Dict[str, Any]