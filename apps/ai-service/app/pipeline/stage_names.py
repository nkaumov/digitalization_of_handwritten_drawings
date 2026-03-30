from typing import Literal

PipelineStageName = Literal[
    "normalize-image",
    "denoise-image",
    "deskew-image",
    "prepare-line-image",
    "prepare-text-image",
    "detect-lines",
    "detect-text",
    "parse-dimensions",
    "build-graph",
    "find-contours",
    "normalize-units",
    "assemble-result",
]

PIPELINE_STAGE_ORDER: tuple[PipelineStageName, ...] = (
    "normalize-image",
    "denoise-image",
    "deskew-image",
    "prepare-line-image",
    "prepare-text-image",
    "detect-lines",
    "detect-text",
    "parse-dimensions",
    "build-graph",
    "find-contours",
    "normalize-units",
    "assemble-result",
)
