from app.core.config import settings
from app.pipeline.config import build_pipeline_config
from app.pipeline.manager import PipelineManager
from app.pipeline.hooks_registry import build_placeholder_hook_manager
from app.pipeline.stages.implementations import build_default_stage_catalog
from app.pipeline.stages.registry import build_pipeline_stage_registry
from app.pipeline.debug_store import persist_debug_bundle
from app.pipeline.types import PipelineStageResult


class PipelineRunner:
    """Facade runner using the pipeline manager with placeholder stage registry."""

    def __init__(self) -> None:
        config = build_pipeline_config(settings)
        registry = build_pipeline_stage_registry(config, catalog=build_default_stage_catalog())
        self._manager = PipelineManager(
            registry,
            continue_on_stage_failure=config.continue_on_stage_failure,
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
        result = self._manager.run(context, triggered_by=triggered_by)
        if settings.debug_artifacts_enabled:
            path = persist_debug_bundle(result, settings.debug_artifacts_dir)
            result.context.setdefault("debug_artifacts", []).append(
                {
                    "kind": "generic",
                    "path": path,
                    "meta": {"source": "pipeline-debug-bundle"},
                }
            )
        return result
