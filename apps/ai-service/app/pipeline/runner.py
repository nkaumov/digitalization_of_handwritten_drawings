from app.pipeline.manager import PipelineManager
from app.pipeline.stages.registry import build_placeholder_stage_registry
from app.pipeline.types import PipelineStageResult


class PipelineRunner:
    """Facade runner using the pipeline manager with placeholder stage registry."""

    def __init__(self) -> None:
        self._manager = PipelineManager(build_placeholder_stage_registry())

    def run(self, image_path: str) -> PipelineStageResult:
        context = {
            "image_path": image_path,
            "target_unit": "mm",
            "warnings": [],
            "stage_notes": [],
            "debug_artifacts": [],
            "stage_trace": [],
            "payload": {
                "version": "1.0",
                "unit": "mm",
                "contours": [],
                "warnings": [],
                "confidence": None,
            },
        }
        return self._manager.run(context)