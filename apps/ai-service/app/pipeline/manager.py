from __future__ import annotations

from datetime import datetime, timezone

from app.core.logger import get_logger
from app.pipeline.hooks import PipelineHookManager
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.types import (
    PipelineHookName,
    PipelineHookContext,
    PipelineStageContext,
    PipelineStageError,
    PipelineStageInput,
    PipelineStageResult,
)
from app.pipeline.stage_names import PipelineStageName

logger = get_logger(__name__)


class PipelineManager:
    """Sequential and safe runner for registered pipeline stages."""

    def __init__(
        self,
        registry: PipelineStageRegistry,
        continue_on_stage_failure: bool = True,
        *,
        hook_manager: PipelineHookManager | None = None,
        default_triggered_by: str = "pipeline-runner",
    ) -> None:
        self._registry = registry
        self._continue_on_stage_failure = continue_on_stage_failure
        self._hook_manager = hook_manager or PipelineHookManager()
        self._default_triggered_by = default_triggered_by
        self._sequence = 0

    def run(
        self,
        context: PipelineStageContext,
        *,
        chain_id: str | None = None,
        triggered_by: str | None = None,
    ) -> PipelineStageResult:
        started_at = datetime.now(timezone.utc)
        started_at_iso = started_at.isoformat()
        chain_id_value = chain_id or self._next_chain_id()
        run_id = self._next_run_id()
        triggered_by_value = triggered_by or self._default_triggered_by

        current_context = dict(context)
        current_context.setdefault("warnings", [])
        current_context.setdefault("stage_notes", [])
        current_context.setdefault("debug_artifacts", [])
        current_context.setdefault("stage_trace", [])

        stage_descriptors = list(self._registry.descriptors())
        stage_count = len(stage_descriptors)

        current_context["runtime"] = {
            "chain_id": chain_id_value,
            "run_id": run_id,
            "triggered_by": triggered_by_value,
            "continue_on_stage_failure": self._continue_on_stage_failure,
            "stage_count": stage_count,
            "started_at_iso": started_at_iso,
        }

        completed: list = []
        errors: list = []
        aborted_by_policy = False

        logger.info(
            "Pipeline execution started",
            extra={
                "chain_id": chain_id_value,
                "run_id": run_id,
                "stage_count": stage_count,
                "continue_on_stage_failure": self._continue_on_stage_failure,
                "triggered_by": triggered_by_value,
            },
        )

        self._emit_hook(
            "before-pipeline-run",
            chain_id=chain_id_value,
            run_id=run_id,
            stage_index=0,
            stage_count=stage_count,
            triggered_by=triggered_by_value,
            context=current_context,
        )

        for index, descriptor in enumerate(stage_descriptors, start=1):
            stage_name = descriptor.stage_name
            stage_started_at_iso = datetime.now(timezone.utc).isoformat()
            current_context["runtime"].update(
                {
                    "current_stage": stage_name,
                    "current_stage_index": index,
                    "current_stage_started_at_iso": stage_started_at_iso,
                }
            )

            self._emit_hook(
                "before-stage-run",
                chain_id=chain_id_value,
                run_id=run_id,
                stage=stage_name,
                stage_index=index,
                stage_count=stage_count,
                triggered_by=triggered_by_value,
                context=current_context,
                meta={"module_id": descriptor.module_id, "handler_id": descriptor.handler_id},
            )

            try:
                logger.info(
                    "Stage execution started",
                    extra={
                        "chain_id": chain_id_value,
                        "run_id": run_id,
                        "stage": stage_name,
                        "stage_index": index,
                        "stage_count": stage_count,
                        "module_id": descriptor.module_id,
                        "handler_id": descriptor.handler_id,
                    },
                )
                stage_input: PipelineStageInput = {
                    "stage": stage_name,
                    "context": current_context,
                    "runtime": current_context["runtime"],
                }
                output = descriptor.handler(stage_input)

                if "context" in output:
                    current_context = output["context"]
                    current_context.setdefault("warnings", [])
                    current_context.setdefault("stage_notes", [])
                    current_context.setdefault("debug_artifacts", [])
                    current_context.setdefault("stage_trace", [])
                    current_context["runtime"] = {
                        **current_context.get("runtime", {}),
                        **{
                            "chain_id": chain_id_value,
                            "run_id": run_id,
                            "triggered_by": triggered_by_value,
                            "continue_on_stage_failure": self._continue_on_stage_failure,
                            "stage_count": stage_count,
                            "started_at_iso": started_at_iso,
                            "current_stage": stage_name,
                            "current_stage_index": index,
                            "current_stage_started_at_iso": stage_started_at_iso,
                        },
                    }

                if output.get("warnings"):
                    current_context["warnings"].extend(output["warnings"])

                if output.get("stage_notes"):
                    current_context["stage_notes"].extend(output["stage_notes"])

                if output.get("debug_artifacts"):
                    current_context["debug_artifacts"].extend(output["debug_artifacts"])

                current_context["stage_trace"].append(stage_name)
                completed.append(stage_name)

                self._emit_hook(
                    "after-stage-run",
                    chain_id=chain_id_value,
                    run_id=run_id,
                    stage=stage_name,
                    stage_index=index,
                    stage_count=stage_count,
                    triggered_by=triggered_by_value,
                    context=current_context,
                    meta={"module_id": descriptor.module_id, "handler_id": descriptor.handler_id},
                )

                logger.info(
                    "Stage execution completed",
                    extra={
                        "chain_id": chain_id_value,
                        "run_id": run_id,
                        "stage": stage_name,
                        "stage_index": index,
                    },
                )
            except Exception as exc:  # noqa: BLE001
                error = PipelineStageError(
                    chain_id=chain_id_value,
                    stage=stage_name,
                    message="STAGE_EXECUTION_FAILED",
                    safe_failure=self._continue_on_stage_failure,
                    details=str(exc),
                )
                errors.append(error)

                self._emit_hook(
                    "on-stage-error",
                    chain_id=chain_id_value,
                    run_id=run_id,
                    stage=stage_name,
                    stage_index=index,
                    stage_count=stage_count,
                    triggered_by=triggered_by_value,
                    context=current_context,
                    error=error,
                    meta={"module_id": descriptor.module_id, "handler_id": descriptor.handler_id},
                )

                logger.exception(
                    "Pipeline stage failed",
                    extra={
                        "chain_id": chain_id_value,
                        "run_id": run_id,
                        "stage": stage_name,
                        "stage_index": index,
                    },
                )

                if not self._continue_on_stage_failure:
                    aborted_by_policy = True
                    logger.error(
                        "Pipeline execution aborted by failure policy",
                        extra={
                            "chain_id": chain_id_value,
                            "run_id": run_id,
                            "stage": stage_name,
                        },
                    )
                    break

        self._emit_hook(
            "after-pipeline-run",
            chain_id=chain_id_value,
            run_id=run_id,
            stage_index=len(completed),
            stage_count=stage_count,
            triggered_by=triggered_by_value,
            context=current_context,
            meta={"aborted_by_policy": str(aborted_by_policy).lower()},
        )

        finished_at = datetime.now(timezone.utc)
        finished_at_iso = finished_at.isoformat()
        duration_ms = int((finished_at - started_at).total_seconds() * 1000)

        result = PipelineStageResult(
            context=current_context,
            chain_id=chain_id_value,
            started_at_iso=started_at_iso,
            finished_at_iso=finished_at_iso,
            duration_ms=duration_ms,
            aborted_by_policy=aborted_by_policy,
            completed_stages=completed,
            errors=errors,
        )
        logger.info(
            "Pipeline execution finished",
            extra={
                "chain_id": chain_id_value,
                "run_id": run_id,
                "duration_ms": duration_ms,
                "completed_stages": len(completed),
                "errors": len(errors),
                "aborted_by_policy": aborted_by_policy,
            },
        )
        return result

    def _emit_hook(
        self,
        hook: PipelineHookName,
        *,
        chain_id: str,
        run_id: str,
        stage_index: int,
        stage_count: int,
        triggered_by: str,
        context: PipelineStageContext,
        stage: PipelineStageName | None = None,
        error: PipelineStageError | None = None,
        meta: dict[str, str] | None = None,
    ) -> None:
        hook_context: PipelineHookContext = {
            "hook": hook,
            "chain_id": chain_id,
            "run_id": run_id,
            "stage_index": stage_index,
            "stage_count": stage_count,
            "triggered_by": triggered_by,
            "continue_on_stage_failure": self._continue_on_stage_failure,
            "context": context,
        }
        if stage is not None:
            hook_context["stage"] = stage
        if error is not None:
            hook_context["error"] = error
        if meta:
            hook_context["meta"] = meta

        self._hook_manager.execute(hook, hook_context)

    def _next_chain_id(self) -> str:
        self._sequence += 1
        return f"pipeline-chain:{self._sequence}"

    def _next_run_id(self) -> str:
        self._sequence += 1
        return f"pipeline-run:{self._sequence}"
