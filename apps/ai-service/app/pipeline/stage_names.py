from typing import Literal

PipelineStageName = Literal[
    "normalize-image",
    "detect-lines",
    "detect-text",
    "parse-dimensions",
    "build-graph",
    "find-contours",
    "normalize-units",
    "assemble-result",
]