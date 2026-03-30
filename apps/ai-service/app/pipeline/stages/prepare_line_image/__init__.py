"""Stage domain placeholder: prepare-line-image."""

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import add_preprocess_output, get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput

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
        import shutil

        source = Path(source_path)
        if source.exists():
            target_dir = Path(settings.debug_artifacts_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f"{source.stem}-line-input{source.suffix or '.bin'}"
            try:
                shutil.copyfile(source, target)
                debug_path = str(target)
                add_preprocess_output(
                    preprocess,
                    kind="line-detection-input",
                    path=debug_path,
                    note="placeholder line detection input",
                )
            except OSError as exc:
                logger.warning(
                    "Failed to store line input placeholder output",
                    extra={"path": str(target), "error": str(exc)},
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
                "meta": {"placeholder": True, "path": debug_path},
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
