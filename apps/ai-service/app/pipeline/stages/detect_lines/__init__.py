"""Stage domain placeholder: detect-lines."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "detect-lines",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "detect-lines",
                "kind": "detected-lines",
                "meta": {"placeholder": True},
            }
        ],
    }