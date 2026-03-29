from __future__ import annotations

from app.pipeline.hooks import PipelineHookManager
from app.pipeline.types import PipelineHookContext


def _passthrough(context: PipelineHookContext) -> PipelineHookContext:
    return context


def build_placeholder_hook_manager() -> PipelineHookManager:
    """Default internal hook registration for stage-4 pipeline architecture."""

    manager = PipelineHookManager()
    manager.register("before-pipeline-run", _passthrough, module_id="hooks.pipeline.before")
    manager.register("after-pipeline-run", _passthrough, module_id="hooks.pipeline.after")
    manager.register("before-stage-run", _passthrough, module_id="hooks.stage.before")
    manager.register("after-stage-run", _passthrough, module_id="hooks.stage.after")
    manager.register("on-stage-error", _passthrough, module_id="hooks.stage.error")
    return manager

