"""Stage domain placeholder: denoise-image."""

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import (
    add_preprocess_output,
    get_latest_output_path,
    persist_preprocess_snapshot,
)
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image, ImageFilter

logger = get_logger(__name__)


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    preprocess = context.get("preprocess", {})
    image_path = (
        get_latest_output_path(preprocess, "normalized-image")
        or preprocess.get("image_path")
        or context.get("image_path")
        or ""
    )

    debug_path = None
    if image_path and settings.debug_artifacts_enabled:
        from pathlib import Path

        source = Path(image_path)
        if source.exists():
            target_dir = Path(settings.debug_artifacts_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f"{source.stem}-denoised{source.suffix or '.png'}"
            try:
                with Image.open(source) as image:
                    denoised = image.filter(ImageFilter.MedianFilter(size=3))
                    denoised.save(target)
                debug_path = str(target)
                add_preprocess_output(
                    preprocess,
                    kind="denoised-image",
                    path=debug_path,
                    note="median filter denoise",
                )
            except (OSError, ValueError) as exc:
                logger.warning(
                    "Failed to store denoised output",
                    extra={"path": str(target), "error": str(exc)},
                )
                add_preprocess_output(
                    preprocess,
                    kind="denoised-image",
                    path=None,
                    note="denoise failed",
                )
        else:
            add_preprocess_output(
                preprocess,
                kind="denoised-image",
                path=None,
                note="source image missing",
            )
    else:
        add_preprocess_output(
            preprocess,
            kind="denoised-image",
            path=None,
            note="debug artifacts disabled",
        )

    context["preprocess"] = preprocess

    snapshot_path = persist_preprocess_snapshot(
        preprocess,
        runtime=context.get("runtime"),
        stage="denoise-image",
    )

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "denoise-image",
                "level": "info",
                "message": "denoise placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "denoise-image",
                "kind": "denoised-image",
                "meta": {"placeholder": True, "path": debug_path},
                **({"path": debug_path} if debug_path else {}),
            },
            *(
                [
                    {
                        "stage": "denoise-image",
                        "kind": "preprocess-summary",
                        "path": snapshot_path,
                        "meta": {"stage": "denoise-image"},
                    }
                ]
                if snapshot_path
                else []
            ),
        ],
    }
