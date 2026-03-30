"""Stage domain: prepare-text-image."""

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import (
    add_preprocess_output,
    get_latest_output_path,
    persist_preprocess_snapshot,
)
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image, ImageOps, ImageFilter

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
    if source_path and settings.debug_artifacts_enabled:
        from pathlib import Path

        source = Path(source_path)
        if source.exists():
            target_dir = Path(settings.debug_artifacts_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f"{source.stem}-text-input{source.suffix or '.png'}"
            try:
                with Image.open(source) as image:
                    gray = ImageOps.grayscale(image)
                    contrast = ImageOps.autocontrast(gray)
                    smoothed = contrast.filter(ImageFilter.MedianFilter(size=3))
                    sharpened = smoothed.filter(
                        ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3)
                    )
                    sharpened.save(target)
                debug_path = str(target)
                add_preprocess_output(
                    preprocess,
                    kind="text-detection-input",
                    path=debug_path,
                    note="grayscale + autocontrast + median + unsharp",
                )
            except (OSError, ValueError) as exc:
                logger.warning(
                    "Failed to store text input output",
                    extra={"path": str(target), "error": str(exc)},
                )
                add_preprocess_output(
                    preprocess,
                    kind="text-detection-input",
                    path=None,
                    note="text prep failed",
                )
        else:
            add_preprocess_output(
                preprocess,
                kind="text-detection-input",
                path=None,
                note="source image missing",
            )
    else:
        add_preprocess_output(
            preprocess,
            kind="text-detection-input",
            path=None,
            note="debug artifacts disabled",
        )

    context["preprocess"] = preprocess

    snapshot_path = persist_preprocess_snapshot(
        preprocess,
        runtime=context.get("runtime"),
        stage="prepare-text-image",
    )

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "prepare-text-image",
                "level": "info",
                "message": "text detection input prepared",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "prepare-text-image",
                "kind": "text-detection-input",
                "meta": {"placeholder": False, "path": debug_path},
                **({"path": debug_path} if debug_path else {}),
            },
            *(
                [
                    {
                        "stage": "prepare-text-image",
                        "kind": "preprocess-summary",
                        "path": snapshot_path,
                        "meta": {"stage": "prepare-text-image"},
                    }
                ]
                if snapshot_path
                else []
            ),
        ],
    }
