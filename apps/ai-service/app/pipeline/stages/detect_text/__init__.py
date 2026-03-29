"""Stage domain placeholder: detect-text."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "detect-text",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "detect-text",
                "kind": "detected-text",
                "meta": {"placeholder": True},
            }
        ],
    }