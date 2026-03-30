from app.pipeline.manager import PipelineManager
from app.pipeline.hooks_registry import build_placeholder_hook_manager
from app.pipeline.stages.registry import build_placeholder_stage_registry
from app.pipeline.types import PipelineStageResult


class PipelineRunner:
    """Facade runner using the pipeline manager with placeholder stage registry."""

    def __init__(self) -> None:
        self._manager = PipelineManager(
            build_placeholder_stage_registry(),
            hook_manager=build_placeholder_hook_manager(),
        )

    def run(
        self,
        image_path: str,
        *,
        drawing_id: str,
        target_unit: str = "mm",
        meta: dict[str, str] | None = None,
        triggered_by: str = "api.recognition.request",
    ) -> PipelineStageResult:
        context = {
            "image_path": image_path,
            "drawing_id": drawing_id,
            "target_unit": target_unit,
            "warnings": [],
            "stage_notes": [],
            "debug_artifacts": [],
            "stage_trace": [],
            "meta": meta or {},
            "payload": {
                "version": "1.0",
                "drawingId": drawing_id,
                "unit": target_unit,
                "contours": [],
                "warnings": [],
                "confidence": None,
            },
        }
        return self._manager.run(context, triggered_by=triggered_by)
