from __future__ import annotations

from app.pipeline.config import PipelineConfig
from app.pipeline.registry import PipelineStageRegistry
from app.pipeline.stage_names import PIPELINE_STAGE_ORDER, PipelineStageName
from app.pipeline.stages.implementations import (
    StageImplementationCatalog,
    build_default_stage_catalog,
)


def build_pipeline_stage_registry(
    config: PipelineConfig,
    *,
    catalog: StageImplementationCatalog | None = None,
) -> PipelineStageRegistry:
    registry = PipelineStageRegistry()
    catalog = catalog or build_default_stage_catalog()
    disabled = set(config.disabled_stages)

    for stage in config.stage_order:
        if stage in disabled:
            continue
        implementation = config.implementations.get(stage, "placeholder")
        handler = catalog.get(stage, implementation)
        if handler is None:
            raise ValueError(
                f"Pipeline stage '{stage}' has no implementation '{implementation}' registered"
            )
        registry.register(
            stage,
            handler,
            module_id=f"stages.{stage}.{implementation}",
        )
    return registry


def build_placeholder_stage_registry() -> PipelineStageRegistry:
    """Compatibility wrapper for stage-4 baseline behavior."""

    default_config = PipelineConfig(stage_order=list(PIPELINE_STAGE_ORDER))
    return build_pipeline_stage_registry(default_config)
