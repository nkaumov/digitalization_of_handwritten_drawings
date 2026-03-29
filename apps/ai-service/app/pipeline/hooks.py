from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import DefaultDict, Dict, List

from app.core.logger import get_logger
from app.pipeline.types import PipelineHookContext, PipelineHookHandler, PipelineHookName

logger = get_logger(__name__)

PIPELINE_HOOK_POINTS: tuple[PipelineHookName, ...] = (
    "before-pipeline-run",
    "after-pipeline-run",
    "before-stage-run",
    "after-stage-run",
    "on-stage-error",
)


@dataclass(frozen=True)
class PipelineHookRegistration:
    hook: PipelineHookName
    handler_id: str
    module_id: str


class PipelineHookManager:
    """Internal hook point manager for pipeline lifecycle events."""

    def __init__(self, continue_on_hook_failure: bool = True) -> None:
        self._continue_on_hook_failure = continue_on_hook_failure
        self._handlers: DefaultDict[PipelineHookName, Dict[str, PipelineHookHandler]] = defaultdict(dict)
        self._sequence = 0

    def register(
        self,
        hook: PipelineHookName,
        handler: PipelineHookHandler,
        *,
        module_id: str = "pipeline-module",
    ) -> PipelineHookRegistration:
        self._sequence += 1
        handler_id = f"{hook}:{self._sequence}"
        self._handlers[hook][handler_id] = handler
        return PipelineHookRegistration(hook=hook, handler_id=handler_id, module_id=module_id)

    def unregister(self, hook: PipelineHookName, handler_id: str) -> bool:
        return self._handlers[hook].pop(handler_id, None) is not None

    def execute(self, hook: PipelineHookName, context: PipelineHookContext) -> PipelineHookContext:
        hook_context = dict(context)
        handlers = self._handlers.get(hook, {})

        logger.info(
            "Pipeline hook execution started",
            extra={
                "hook": hook,
                "chain_id": context.get("chain_id"),
                "handler_count": len(handlers),
            },
        )

        for handler_id, handler in handlers.items():
            try:
                result = handler(hook_context)
                if result is not None:
                    hook_context = dict(result)
            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "Pipeline hook handler failed",
                    extra={
                        "hook": hook,
                        "handler_id": handler_id,
                        "chain_id": context.get("chain_id"),
                    },
                )
                if not self._continue_on_hook_failure:
                    logger.error(
                        "Pipeline hook execution aborted by failure policy",
                        extra={"hook": hook, "chain_id": context.get("chain_id"), "error": str(exc)},
                    )
                    break

        logger.info(
            "Pipeline hook execution finished",
            extra={
                "hook": hook,
                "chain_id": context.get("chain_id"),
            },
        )
        return hook_context

    def list_hook_points(self) -> List[PipelineHookName]:
        return list(PIPELINE_HOOK_POINTS)
