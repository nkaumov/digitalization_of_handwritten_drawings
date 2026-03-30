from __future__ import annotations

from typing import Dict

from app.pipeline.stage_names import PipelineStageName
from app.pipeline.types import StageHandler
from app.pipeline.stages.assemble_result import run as run_assemble_result
from app.pipeline.stages.build_graph import run as run_build_graph
from app.pipeline.stages.detect_lines import run as run_detect_lines
from app.pipeline.stages.detect_text import run as run_detect_text
from app.pipeline.stages.find_contours import run as run_find_contours
from app.pipeline.stages.normalize_image import run as run_normalize_image
from app.pipeline.stages.normalize_units import run as run_normalize_units
from app.pipeline.stages.parse_dimensions import run as run_parse_dimensions


class StageImplementationCatalog:
    def __init__(self) -> None:
        self._catalog: Dict[PipelineStageName, Dict[str, StageHandler]] = {}

    def register(
        self,
        stage: PipelineStageName,
        implementation: str,
        handler: StageHandler,
    ) -> None:
        entry = self._catalog.setdefault(stage, {})
        entry[implementation] = handler

    def get(self, stage: PipelineStageName, implementation: str) -> StageHandler | None:
        return self._catalog.get(stage, {}).get(implementation)


def build_default_stage_catalog() -> StageImplementationCatalog:
    catalog = StageImplementationCatalog()
    catalog.register("normalize-image", "placeholder", run_normalize_image)
    catalog.register("detect-lines", "placeholder", run_detect_lines)
    catalog.register("detect-text", "placeholder", run_detect_text)
    catalog.register("parse-dimensions", "placeholder", run_parse_dimensions)
    catalog.register("build-graph", "placeholder", run_build_graph)
    catalog.register("find-contours", "placeholder", run_find_contours)
    catalog.register("normalize-units", "placeholder", run_normalize_units)
    catalog.register("assemble-result", "placeholder", run_assemble_result)
    return catalog
