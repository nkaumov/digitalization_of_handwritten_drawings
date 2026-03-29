from app.pipeline.manager import PipelineManager
from app.pipeline.stages.registry import build_placeholder_stage_registry
from app.pipeline.types import PipelineStageContext, PipelineStageResult


class PipelineRunner:
    """Facade runner using the pipeline manager with placeholder stage registry."""

    def __init__(self) -> None:
        self._manager = PipelineManager(build_placeholder_stage_registry())

    def run(self, image_path: str) -> PipelineStageResult:
        context: PipelineStageContext = {
            "image_path": image_path,
            "warnings": [],
            "stages": [],
        }
        return self._manager.run(context)