"""Stage domain: detect-lines."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Tuple

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image

logger = get_logger(__name__)

MIN_SEGMENT_LENGTH_PX = 30
MERGE_GAP_PX = 4
INTERSECTION_PADDING_PX = 1


@dataclass(frozen=True)
class LineCandidate:
    x1: int
    y1: int
    x2: int
    y2: int
    orientation: str
    length_px: int


@dataclass(frozen=True)
class LineSegment:
    id: str
    x1: int
    y1: int
    x2: int
    y2: int
    orientation: str
    length_px: int


@dataclass(frozen=True)
class LineEndpoint:
    segment_id: str
    x: int
    y: int


@dataclass(frozen=True)
class LineIntersection:
    x: int
    y: int
    horizontal_id: str
    vertical_id: str


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


def _filter_candidates(candidates: List[LineCandidate]) -> List[LineCandidate]:
    return [item for item in candidates if item.length_px >= MIN_SEGMENT_LENGTH_PX]


def _merge_runs(runs: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    if not runs:
        return []
    runs.sort()
    merged: List[Tuple[int, int]] = []
    current_start, current_end = runs[0]
    for start, end in runs[1:]:
        if start <= current_end + MERGE_GAP_PX:
            current_end = max(current_end, end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    merged.append((current_start, current_end))
    return merged


def _merge_segments(candidates: List[LineCandidate]) -> List[LineSegment]:
    horizontals: dict[int, List[Tuple[int, int]]] = {}
    verticals: dict[int, List[Tuple[int, int]]] = {}

    for item in candidates:
        if item.orientation == "horizontal":
            y = item.y1
            start, end = sorted((item.x1, item.x2))
            horizontals.setdefault(y, []).append((start, end))
        else:
            x = item.x1
            start, end = sorted((item.y1, item.y2))
            verticals.setdefault(x, []).append((start, end))

    segments: List[LineSegment] = []
    idx = 1
    for y, runs in horizontals.items():
        for start, end in _merge_runs(runs):
            segments.append(
                LineSegment(
                    id=f"line-h-{idx}",
                    x1=start,
                    y1=y,
                    x2=end,
                    y2=y,
                    orientation="horizontal",
                    length_px=end - start,
                )
            )
            idx += 1

    for x, runs in verticals.items():
        for start, end in _merge_runs(runs):
            segments.append(
                LineSegment(
                    id=f"line-v-{idx}",
                    x1=x,
                    y1=start,
                    x2=x,
                    y2=end,
                    orientation="vertical",
                    length_px=end - start,
                )
            )
            idx += 1

    return segments


def _build_endpoints(segments: List[LineSegment]) -> List[LineEndpoint]:
    endpoints: List[LineEndpoint] = []
    for segment in segments:
        endpoints.append(LineEndpoint(segment.id, segment.x1, segment.y1))
        endpoints.append(LineEndpoint(segment.id, segment.x2, segment.y2))
    return endpoints


def _find_intersections(segments: List[LineSegment]) -> List[LineIntersection]:
    horizontals = [s for s in segments if s.orientation == "horizontal"]
    verticals = [s for s in segments if s.orientation == "vertical"]
    intersections: List[LineIntersection] = []
    for h in horizontals:
        x_min, x_max = sorted((h.x1, h.x2))
        for v in verticals:
            y_min, y_max = sorted((v.y1, v.y2))
            if (
                x_min - INTERSECTION_PADDING_PX
                <= v.x1
                <= x_max + INTERSECTION_PADDING_PX
                and y_min - INTERSECTION_PADDING_PX
                <= h.y1
                <= y_max + INTERSECTION_PADDING_PX
            ):
                intersections.append(
                    LineIntersection(
                        x=v.x1,
                        y=h.y1,
                        horizontal_id=h.id,
                        vertical_id=v.id,
                    )
                )
    return intersections


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

    filtered = _filter_candidates(candidates)
    merged = _merge_segments(filtered)
    endpoints = _build_endpoints(merged)
    intersections = _find_intersections(merged)

    if filtered and settings.debug_artifacts_enabled:
        stem = Path(source_path).stem if source_path else "input"
        debug_dir = Path(settings.debug_artifacts_dir)
        debug_path = _persist_candidates(filtered, outputs_dir=debug_dir, stem=stem)
        try:
            (debug_dir / f"{stem}-line-merged.json").write_text(
                json.dumps([asdict(item) for item in merged], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            (debug_dir / f"{stem}-line-endpoints.json").write_text(
                json.dumps([asdict(item) for item in endpoints], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            (debug_dir / f"{stem}-line-intersections.json").write_text(
                json.dumps([asdict(item) for item in intersections], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError as exc:
            logger.warning("Failed to store line postprocess artifacts", extra={"error": str(exc)})

    context.setdefault("meta", {})
    context["meta"]["line_candidates"] = [asdict(item) for item in candidates]
    context["meta"]["line_candidates_filtered"] = [asdict(item) for item in filtered]
    context["meta"]["line_segments_merged"] = [asdict(item) for item in merged]
    context["meta"]["line_endpoints"] = [asdict(item) for item in endpoints]
    context["meta"]["line_intersections"] = [asdict(item) for item in intersections]

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "detect-lines",
                "level": "info",
                "message": (
                    f"detected {len(candidates)} candidates, "
                    f"{len(merged)} merged segments, "
                    f"{len(intersections)} intersections"
                ),
            }
        ],
        "debug_artifacts": [
            {
                "stage": "detect-lines",
                "kind": "detected-lines",
                "meta": {
                    "count": len(candidates),
                    "filtered": len(filtered),
                    "merged": len(merged),
                    "intersections": len(intersections),
                    "source": source_path,
                },
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
