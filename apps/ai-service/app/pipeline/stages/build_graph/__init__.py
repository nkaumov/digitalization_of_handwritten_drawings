"""Stage domain placeholder: build-graph."""

from app.pipeline.types import PipelineStageInput, PipelineStageOutput


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "build-graph",
                "level": "info",
                "message": "placeholder executed",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "build-graph",
                "kind": "graph",
                "meta": {"placeholder": True},
            }
        ],
    }