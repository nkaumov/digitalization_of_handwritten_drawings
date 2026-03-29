"""Stage domain placeholder: assemble-result."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "assemble-result",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "assemble-result",
                "kind": "assembled-result",
                "meta": {"placeholder": True},
            }
        ],
    }