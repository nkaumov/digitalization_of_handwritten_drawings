"""Stage domain placeholder: normalize-units."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "normalize-units",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "normalize-units",
                "kind": "normalized-units",
                "meta": {"placeholder": True},
            }
        ],
    }