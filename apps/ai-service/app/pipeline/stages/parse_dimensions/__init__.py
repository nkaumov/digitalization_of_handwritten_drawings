"""Stage domain placeholder: parse-dimensions."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "parse-dimensions",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "parse-dimensions",
                "kind": "parsed-dimensions",
                "meta": {"placeholder": True},
            }
        ],
    }