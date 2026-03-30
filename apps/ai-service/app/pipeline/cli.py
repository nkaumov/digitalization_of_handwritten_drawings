from __future__ import annotations

import argparse
import sys
from typing import Iterable, List

from app.core.config import settings
from app.core.logger import configure_logging, get_logger
from app.pipeline.config import PipelineConfig, build_pipeline_config
from app.pipeline.hooks_registry import build_placeholder_hook_manager
from app.pipeline.manager import PipelineManager
from app.pipeline.runner import PipelineRunner
from app.pipeline.stage_names import PIPELINE_STAGE_ORDER, PipelineStageName
from app.pipeline.stages.implementations import build_default_stage_catalog
from app.pipeline.stages.registry import build_pipeline_stage_registry
from app.pipeline.types import PipelineStageContext

logger = get_logger(__name__)


def _parse_stage(value: str) -> PipelineStageName:
    if value not in PIPELINE_STAGE_ORDER:
        raise ValueError(f"Unknown stage name: {value}")
    return value  # type: ignore[return-value]


def _resolve_stage_order(
    base_config: PipelineConfig,
    *,
    only_stage: PipelineStageName | None,
    until_stage: PipelineStageName | None,
) -> List[PipelineStageName]:
    if only_stage:
        return [only_stage]

    stage_order = list(base_config.stage_order)
    if until_stage and until_stage in stage_order:
        index = stage_order.index(until_stage) + 1
        return stage_order[:index]

    return stage_order


def _run_sequence(
    context: PipelineStageContext,
    stage_order: Iterable[PipelineStageName],
    *,
    config: PipelineConfig,
    step_mode: bool,
    pause: bool,
) -> PipelineStageContext:
    current_context = dict(context)
    catalog = build_default_stage_catalog()
    hook_manager = build_placeholder_hook_manager()

    for stage in stage_order:
        stage_config = PipelineConfig(
            stage_order=[stage],
            disabled_stages=config.disabled_stages,
            continue_on_stage_failure=config.continue_on_stage_failure,
            implementations=config.implementations,
        )
        registry = build_pipeline_stage_registry(stage_config, catalog=catalog)
        manager = PipelineManager(
            registry,
            continue_on_stage_failure=config.continue_on_stage_failure,
            hook_manager=hook_manager,
            default_triggered_by="cli.step",
        )
        result = manager.run(current_context, triggered_by="cli.step")
        current_context = result.context

        logger.info(
            "Stage step finished",
            extra={"stage": stage, "errors": len(result.errors)},
        )

        if pause:
            input("Press Enter to continue to next stage...")

        if step_mode:
            break

    return current_context


def main(argv: List[str] | None = None) -> int:
    configure_logging(settings.log_level)

    parser = argparse.ArgumentParser(description="Local pipeline test runner")
    parser.add_argument("image_path", help="Path to input image")
    parser.add_argument("--drawing-id", default="drawing_local", help="Drawing id for payload")
    parser.add_argument("--target-unit", default="mm", help="Target unit (mm)")
    parser.add_argument("--list-stages", action="store_true", help="List known stages and exit")
    parser.add_argument("--step", action="store_true", help="Run a single stage step")
    parser.add_argument("--pause", action="store_true", help="Pause between stages")
    parser.add_argument("--stage", help="Run only a specific stage by name")
    parser.add_argument("--until", help="Run stages up to and including this stage")
    args = parser.parse_args(argv)

    if args.list_stages:
        print("Known stages:")
        for stage in PIPELINE_STAGE_ORDER:
            print(f"- {stage}")
        return 0

    configure_logging(settings.log_level)
    base_config = build_pipeline_config(settings)

    only_stage = _parse_stage(args.stage) if args.stage else None
    until_stage = _parse_stage(args.until) if args.until else None
    stage_order = _resolve_stage_order(base_config, only_stage=only_stage, until_stage=until_stage)

    if args.step and not stage_order:
        print("No stages to execute.")
        return 1

    if args.step or args.pause or args.stage or args.until:
        logger.info(
            "Running pipeline in step mode",
            extra={"stage_order": stage_order},
        )
        context: PipelineStageContext = {
            "image_path": args.image_path,
            "drawing_id": args.drawing_id,
            "target_unit": args.target_unit,
            "warnings": [],
            "stage_notes": [],
            "debug_artifacts": [],
            "stage_trace": [],
            "meta": {"mode": "cli.step"},
            "payload": {
                "version": "1.0",
                "drawingId": args.drawing_id,
                "unit": args.target_unit,
                "contours": [],
                "warnings": [],
                "confidence": None,
            },
        }
        _run_sequence(
            context,
            stage_order,
            config=base_config,
            step_mode=args.step,
            pause=args.pause,
        )
        return 0

    runner = PipelineRunner()
    runner.run(
        args.image_path,
        drawing_id=args.drawing_id,
        target_unit=args.target_unit,
        meta={"mode": "cli.full"},
        triggered_by="cli.full",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
