"""Stage domain: detect-lines."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, List

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image

logger = get_logger(__name__)

MIN_SEGMENT_LENGTH_PX = 30


@dataclass(frozen=True)
class LineCandidate:
    x1: int
    y1: int
    x2: int
    y2: int
    orientation: str
    length_px: int


def _scan_runs(values: Iterable[int], threshold: int) -> List[tuple[int, int]]:
    runs: List[tuple[int, int]] = []
    start = None
    for idx, value in enumerate(values):
        if value >= threshold:
            if start is None:
                start = idx
        elif start is not None:
            runs.append((start, idx - 1))
            start = None
    if start is not None:
        runs.append((start, len(list(values)) - 1))
    return runs


def _detect_horizontal(image: Image.Image, threshold: int) -> List[LineCandidate]:
    width, height = image.size
    pixels = image.load()
    candidates: List[LineCandidate] = []
    for y in range(height):
        row = [pixels[x, y] for x in range(width)]
        start = None
        for x, value in enumerate(row):
            if value >= threshold:
                if start is None:
                    start = x
            elif start is not None:
                if x - start >= MIN_SEGMENT_LENGTH_PX:
                    candidates.append(
                        LineCandidate(start, y, x - 1, y, "horizontal", x - start)
                    )
                start = None
        if start is not None and width - start >= MIN_SEGMENT_LENGTH_PX:
            candidates.append(
                LineCandidate(start, y, width - 1, y, "horizontal", width - start)
            )
    return candidates


def _detect_vertical(image: Image.Image, threshold: int) -> List[LineCandidate]:
    width, height = image.size
    pixels = image.load()
    candidates: List[LineCandidate] = []
    for x in range(width):
        start = None
        for y in range(height):
            value = pixels[x, y]
            if value >= threshold:
                if start is None:
                    start = y
            elif start is not None:
                if y - start >= MIN_SEGMENT_LENGTH_PX:
                    candidates.append(
                        LineCandidate(x, start, x, y - 1, "vertical", y - start)
                    )
                start = None
        if start is not None and height - start >= MIN_SEGMENT_LENGTH_PX:
            candidates.append(
                LineCandidate(x, start, x, height - 1, "vertical", height - start)
            )
    return candidates


def _persist_candidates(
    candidates: List[LineCandidate],
    *,
    outputs_dir: Path,
    stem: str,
) -> str | None:
    outputs_dir.mkdir(parents=True, exist_ok=True)
    path = outputs_dir / f"{stem}-line-candidates.json"
    payload = [asdict(item) for item in candidates]
    try:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as exc:
        logger.warning("Failed to save line candidates", extra={"path": str(path), "error": str(exc)})
        return None
    return str(path)


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    preprocess = context.get("preprocess", {})
    source_path = get_latest_output_path(preprocess, "line-detection-input")
    candidates: List[LineCandidate] = []
    debug_path = None

    if source_path:
        try:
            with Image.open(source_path) as image:
                gray = image.convert("L")
                candidates = _detect_horizontal(gray, threshold=128) + _detect_vertical(
                    gray, threshold=128
                )
        except (OSError, ValueError) as exc:
            logger.warning(
                "Failed to process line detection input",
                extra={"path": source_path, "error": str(exc)},
            )

    if candidates and settings.debug_artifacts_enabled:
        stem = Path(source_path).stem if source_path else "input"
        debug_path = _persist_candidates(
            candidates,
            outputs_dir=Path(settings.debug_artifacts_dir),
            stem=stem,
        )

    context.setdefault("meta", {})
    context["meta"]["line_candidates"] = [asdict(item) for item in candidates]

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "detect-lines",
                "level": "info",
                "message": f"detected {len(candidates)} line candidates",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "detect-lines",
                "kind": "detected-lines",
                "meta": {
                    "count": len(candidates),
                    "source": source_path,
                },
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
