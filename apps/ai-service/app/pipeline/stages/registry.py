from __future__ import annotations

from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.stages.assemble_result import run as run_assemble_result
from app.pipeline.stages.build_graph import run as run_build_graph
from app.pipeline.stages.detect_lines import run as run_detect_lines
from app.pipeline.stages.detect_text import run as run_detect_text
from app.pipeline.stages.find_contours import run as run_find_contours
from app.pipeline.stages.normalize_image import run as run_normalize_image
from app.pipeline.stages.normalize_units import run as run_normalize_units
from app.pipeline.stages.parse_dimensions import run as run_parse_dimensions


def build_placeholder_stage_registry() -> PipelineStageRegistry:
    """Default placeholder stage registration for stage-4 architecture baseline."""

    registry = PipelineStageRegistry()
    registry.register("normalize-image", run_normalize_image)
    registry.register("detect-lines", run_detect_lines)
    registry.register("detect-text", run_detect_text)
    registry.register("parse-dimensions", run_parse_dimensions)
    registry.register("build-graph", run_build_graph)
    registry.register("find-contours", run_find_contours)
    registry.register("normalize-units", run_normalize_units)
    registry.register("assemble-result", run_assemble_result)
    return registry