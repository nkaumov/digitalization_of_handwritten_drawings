from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List

from app.core.config import Settings
from app.pipeline.stage_names import PIPELINE_STAGE_ORDER, PipelineStageName


@dataclass(frozen=True)
class PipelineStageSelection:
    stage: PipelineStageName
    implementation: str = "placeholder"


@dataclass(frozen=True)
class PipelineConfig:
    stage_order: List[PipelineStageName]
    disabled_stages: List[PipelineStageName] = field(default_factory=list)
    continue_on_stage_failure: bool = True
    implementations: Dict[PipelineStageName, str] = field(default_factory=dict)


def _parse_csv(value: str | None) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _filter_valid_stage_names(items: Iterable[str]) -> List[PipelineStageName]:
    valid = set(PIPELINE_STAGE_ORDER)
    return [item for item in items if item in valid]  # type: ignore[return-value]


def build_pipeline_config(settings: Settings) -> PipelineConfig:
    configured_order = _filter_valid_stage_names(_parse_csv(settings.pipeline_stage_order))
    stage_order = configured_order or list(PIPELINE_STAGE_ORDER)

    disabled = _filter_valid_stage_names(_parse_csv(settings.pipeline_disabled_stages))

    return PipelineConfig(
        stage_order=stage_order,
        disabled_stages=disabled,
        continue_on_stage_failure=settings.pipeline_continue_on_stage_failure,
    )
