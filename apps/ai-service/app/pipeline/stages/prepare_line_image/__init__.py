"""Stage domain: prepare-line-image."""

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import (
    add_preprocess_output,
    get_latest_output_path,
    persist_preprocess_snapshot,
)
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image, ImageOps, ImageFilter, ImageStat

logger = get_logger(__name__)


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    preprocess = context.get("preprocess", {})

    source_path = (
        get_latest_output_path(preprocess, "deskewed-image")
        or get_latest_output_path(preprocess, "denoised-image")
        or get_latest_output_path(preprocess, "normalized-image")
        or preprocess.get("image_path")
        or context.get("image_path")
        or ""
    )

    debug_path = None
    threshold_value = None
    if source_path and settings.debug_artifacts_enabled:
        from pathlib import Path

        source = Path(source_path)
        if source.exists():
            target_dir = Path(settings.debug_artifacts_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f"{source.stem}-line-input{source.suffix or '.png'}"
            try:
                with Image.open(source) as image:
                    gray = ImageOps.grayscale(image)
                    contrast = ImageOps.autocontrast(gray)
                    edges = contrast.filter(ImageFilter.FIND_EDGES)
                    mean = ImageStat.Stat(edges).mean[0]
                    threshold_value = max(30, min(220, int(mean)))
                    binary = edges.point(lambda v: 255 if v > threshold_value else 0)
                    binary.save(target)
                debug_path = str(target)
                add_preprocess_output(
                    preprocess,
                    kind="line-detection-input",
                    path=debug_path,
                    note="edges + threshold",
                )
            except (OSError, ValueError) as exc:
                logger.warning(
                    "Failed to store line input output",
                    extra={"path": str(target), "error": str(exc)},
                )
                add_preprocess_output(
                    preprocess,
                    kind="line-detection-input",
                    path=None,
                    note="line prep failed",
                )
        else:
            add_preprocess_output(
                preprocess,
                kind="line-detection-input",
                path=None,
                note="source image missing",
            )
    else:
        add_preprocess_output(
            preprocess,
            kind="line-detection-input",
            path=None,
            note="debug artifacts disabled",
        )

    context["preprocess"] = preprocess

    snapshot_path = persist_preprocess_snapshot(
        preprocess,
        runtime=context.get("runtime"),
        stage="prepare-line-image",
    )

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "prepare-line-image",
                "level": "info",
                "message": "line detection input prepared",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "prepare-line-image",
                "kind": "line-detection-input",
                "meta": {
                    "placeholder": False,
                    "path": debug_path,
                    "threshold": threshold_value,
                },
                **({"path": debug_path} if debug_path else {}),
            },
            *(
                [
                    {
                        "stage": "prepare-line-image",
                        "kind": "preprocess-summary",
                        "path": snapshot_path,
                        "meta": {"stage": "prepare-line-image"},
                    }
                ]
                if snapshot_path
                else []
            ),
        ],
    }
