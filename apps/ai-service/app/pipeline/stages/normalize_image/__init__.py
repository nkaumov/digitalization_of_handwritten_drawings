"""Stage domain placeholder: normalize-image."""

from app.pipeline.preprocess import build_preprocess_context
from app.pipeline.types import PipelineStageInput, PipelineStageOutput


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

    debug_artifact = {
        "stage": "normalize-image",
        "kind": "normalized-image",
        "meta": {
            "placeholder": True,
            "exists": preprocess.get("exists"),
            "size_bytes": preprocess.get("size_bytes"),
            "mime_type": preprocess.get("mime_type"),
        },
    }
    if image_path:
        debug_artifact["path"] = image_path

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
            debug_artifact
        ],
    }
