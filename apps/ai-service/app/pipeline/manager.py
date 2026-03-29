from __future__ import annotations

from app.core.logger import get_logger
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.types import (
    PipelineStageError,
    PipelineStageInput,
    PipelineStageResult,
)

logger = get_logger(__name__)


class PipelineManager:
    """Sequential and safe runner for registered pipeline stages."""

    def __init__(self, registry: PipelineStageRegistry) -> None:
        self._registry = registry

    def run(self, context: dict) -> PipelineStageResult:
        current_context = dict(context)
        current_context.setdefault("warnings", [])
        current_context.setdefault("stage_notes", [])
        current_context.setdefault("debug_artifacts", [])
        current_context.setdefault("stage_trace", [])

        completed = []
        errors = []

        for stage_name, handler in self._registry.items():
            try:
                stage_input: PipelineStageInput = {
                    "stage": stage_name,
                    "context": current_context,
                }
                output = handler(stage_input)

                if "context" in output:
                    current_context = output["context"]

                if output.get("warnings"):
                    current_context["warnings"].extend(output["warnings"])

                if output.get("stage_notes"):
                    current_context["stage_notes"].extend(output["stage_notes"])

                if output.get("debug_artifacts"):
                    current_context["debug_artifacts"].extend(output["debug_artifacts"])

                current_context["stage_trace"].append(stage_name)
                completed.append(stage_name)
            except Exception as exc:  # noqa: BLE001
                error = PipelineStageError(
                    stage=stage_name,
                    message="STAGE_EXECUTION_FAILED",
                    details=str(exc),
                )
                errors.append(error)
                logger.exception("Pipeline stage failed", extra={"stage": stage_name})

        return PipelineStageResult(
            context=current_context,
            completed_stages=completed,
            errors=errors,
        )