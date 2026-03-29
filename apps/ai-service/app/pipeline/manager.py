from __future__ import annotations

from app.core.logger import get_logger
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.types import (
    PipelineStageContext,
    PipelineStageError,
    PipelineStageInput,
    PipelineStageResult,
)

logger = get_logger(__name__)


class PipelineManager:
    """Sequential and safe runner for registered pipeline stages."""

    def __init__(
        self,
        registry: PipelineStageRegistry,
        continue_on_stage_failure: bool = True,
    ) -> None:
        self._registry = registry
        self._continue_on_stage_failure = continue_on_stage_failure

    def run(self, context: PipelineStageContext) -> PipelineStageResult:
        current_context = dict(context)
        current_context.setdefault("warnings", [])
        current_context.setdefault("stage_notes", [])
        current_context.setdefault("debug_artifacts", [])
        current_context.setdefault("stage_trace", [])

        completed = []
        errors = []
        stage_count = len(self._registry.names())

        logger.info(
            "Pipeline execution started",
            extra={
                "stage_count": stage_count,
                "continue_on_stage_failure": self._continue_on_stage_failure,
            },
        )

        for stage_name, handler in self._registry.items():
            try:
                logger.info("Stage execution started", extra={"stage": stage_name})
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
                logger.info("Stage execution completed", extra={"stage": stage_name})
            except Exception as exc:  # noqa: BLE001
                error = PipelineStageError(
                    stage=stage_name,
                    message="STAGE_EXECUTION_FAILED",
                    safe_failure=self._continue_on_stage_failure,
                    details=str(exc),
                )
                errors.append(error)
                logger.exception("Pipeline stage failed", extra={"stage": stage_name})
                if not self._continue_on_stage_failure:
                    logger.error(
                        "Pipeline execution aborted by failure policy",
                        extra={"stage": stage_name},
                    )
                    break

        result = PipelineStageResult(
            context=current_context,
            completed_stages=completed,
            errors=errors,
        )
        logger.info(
            "Pipeline execution finished",
            extra={"completed_stages": len(completed), "errors": len(errors)},
        )
        return result
