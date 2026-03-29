"""Stage domain placeholder: normalize-image."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "normalize-image",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "normalize-image",
                "kind": "normalized-image",
                "meta": {"placeholder": True},
            }
        ],
    }