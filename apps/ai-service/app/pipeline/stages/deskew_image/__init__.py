"""Stage domain: deskew-image."""

from __future__ import annotations

from statistics import pvariance

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import (
    add_preprocess_output,
    get_latest_output_path,
    persist_preprocess_snapshot,
)
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image, ImageOps

logger = get_logger(__name__)

_ANGLE_RANGE = range(-5, 6)
_ANGLE_STEP = 0.5


def _estimate_skew_angle(image: Image.Image) -> float:
    grayscale = ImageOps.grayscale(image)
    width, height = grayscale.size
    target_width = 600
    if width > target_width:
        scale = target_width / width
        grayscale = grayscale.resize(
            (target_width, max(1, int(height * scale))),
            resample=Image.Resampling.BILINEAR,
        )

    inverted = ImageOps.invert(grayscale)
    best_angle = 0.0
    best_score = -1.0

    for step in _ANGLE_RANGE:
        angle = step * _ANGLE_STEP
        rotated = inverted.rotate(angle, expand=True, fillcolor=0)
        data = list(rotated.getdata())
        w, h = rotated.size
        if w == 0 or h == 0:
            continue
        rows = [
            sum(data[row_start : row_start + w])
            for row_start in range(0, len(data), w)
        ]
        if len(rows) < 2:
            continue
        score = pvariance(rows)
        if score > best_score:
            best_score = score
            best_angle = angle

    if abs(best_angle) < 0.2:
        return 0.0
    return best_angle


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    preprocess = context.get("preprocess", {})

    source_path = (
        get_latest_output_path(preprocess, "denoised-image")
        or get_latest_output_path(preprocess, "normalized-image")
        or preprocess.get("image_path")
        or context.get("image_path")
        or ""
    )

    debug_path = None
    detected_angle = 0.0
    if source_path and settings.debug_artifacts_enabled:
        from pathlib import Path

        source = Path(source_path)
        if source.exists():
            target_dir = Path(settings.debug_artifacts_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f"{source.stem}-deskewed{source.suffix or '.png'}"
            try:
                with Image.open(source) as image:
                    image = ImageOps.exif_transpose(image)
                    detected_angle = _estimate_skew_angle(image)
                    if detected_angle:
                        corrected = image.rotate(
                            detected_angle,
                            expand=True,
                            fillcolor=(255, 255, 255),
                        )
                    else:
                        corrected = image
                    corrected.save(target)
                debug_path = str(target)
                add_preprocess_output(
                    preprocess,
                    kind="deskewed-image",
                    path=debug_path,
                    note="deskew using row projection variance",
                )
            except (OSError, ValueError) as exc:
                logger.warning(
                    "Failed to store deskew output",
                    extra={"path": str(target), "error": str(exc)},
                )
                add_preprocess_output(
                    preprocess,
                    kind="deskewed-image",
                    path=None,
                    note="deskew failed",
                )
        else:
            add_preprocess_output(
                preprocess,
                kind="deskewed-image",
                path=None,
                note="source image missing",
            )
    else:
        add_preprocess_output(
            preprocess,
            kind="deskewed-image",
            path=None,
            note="debug artifacts disabled",
        )

    context["preprocess"] = preprocess

    snapshot_path = persist_preprocess_snapshot(
        preprocess,
        runtime=context.get("runtime"),
        stage="deskew-image",
    )

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "deskew-image",
                "level": "info",
                "message": "deskew executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "deskew-image",
                "kind": "deskewed-image",
                "meta": {"placeholder": False, "path": debug_path, "angle": detected_angle},
                **({"path": debug_path} if debug_path else {}),
            },
            *(
                [
                    {
                        "stage": "deskew-image",
                        "kind": "preprocess-summary",
                        "path": snapshot_path,
                        "meta": {"stage": "deskew-image"},
                    }
                ]
                if snapshot_path
                else []
            ),
        ],
    }
