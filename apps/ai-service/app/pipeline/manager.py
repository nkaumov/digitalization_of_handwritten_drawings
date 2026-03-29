from __future__ import annotations

from app.core.logger import get_logger
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.types import (
    PipelineStageContext,
    PipelineStageError,
    PipelineStageName,
    PipelineStageResult,
)

logger = get_logger(__name__)


class PipelineManager:
    """Sequential and safe runner for registered pipeline stages."""

    def __init__(self, registry: PipelineStageRegistry) -> None:
        self._registry = registry

    def run(self, context: PipelineStageContext) -> PipelineStageResult:
        current_context: PipelineStageContext = dict(context)
        current_context.setdefault("stages", [])
        current_context.setdefault("warnings", [])

        completed: list[PipelineStageName] = []
        errors: list[PipelineStageError] = []

        for stage_name, handler in self._registry.items():
            try:
                current_context = handler(current_context)
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