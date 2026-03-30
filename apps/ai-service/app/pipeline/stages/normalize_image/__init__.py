"""Stage domain placeholder: normalize-image."""

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import (
    add_preprocess_output,
    build_preprocess_context,
    persist_preprocess_snapshot,
)
from app.pipeline.types import PipelineStageInput, PipelineStageOutput

logger = get_logger(__name__)


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    image_path = context.get("image_path", "")
    preprocess = build_preprocess_context(image_path) if image_path else {"notes": ["missing image_path"]}
    context["preprocess"] = preprocess

    warnings = []
    if preprocess.get("exists") is False:
        warnings.append(
            {
                "stage": "normalize-image",
                "level": "error",
                "code": "IMAGE_FILE_NOT_FOUND",
                "message": "Input image file not found",
            }
        )

    debug_path = None
    if image_path and preprocess.get("exists") and settings.debug_artifacts_enabled:
        from pathlib import Path
        import shutil

        source = Path(image_path)
        target_dir = Path(settings.debug_artifacts_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"{source.stem}-normalized{source.suffix or '.bin'}"
        try:
            shutil.copyfile(source, target)
            debug_path = str(target)
            add_preprocess_output(
                preprocess,
                kind="normalized-image",
                path=debug_path,
                note="placeholder normalization output",
            )
        except OSError as exc:
            logger.warning(
                "Failed to store normalized placeholder output",
                extra={"path": str(target), "error": str(exc)},
            )
    else:
        add_preprocess_output(
            preprocess,
            kind="normalized-image",
            path=None,
            note="debug artifacts disabled or file missing",
        )

    debug_artifact = {
        "stage": "normalize-image",
        "kind": "normalized-image",
        "meta": {
            "placeholder": True,
            "exists": preprocess.get("exists"),
            "size_bytes": preprocess.get("size_bytes"),
            "mime_type": preprocess.get("mime_type"),
            "path": debug_path,
        },
    }
    if debug_path:
        debug_artifact["path"] = debug_path

    snapshot_path = persist_preprocess_snapshot(
        preprocess,
        runtime=context.get("runtime"),
        stage="normalize-image",
    )

    return {
        "context": context,
        "warnings": warnings,
        "stage_notes": [
            {
                "stage": "normalize-image",
                "level": "info",
                "message": "preprocess context captured",
            }
        ],
        "debug_artifacts": [
            debug_artifact,
            *(
                [
                    {
                        "stage": "normalize-image",
                        "kind": "preprocess-summary",
                        "path": snapshot_path,
                        "meta": {"stage": "normalize-image"},
                    }
                ]
                if snapshot_path
                else []
            ),
        ],
    }
