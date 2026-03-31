"""Stage domain: detect-text."""

from __future__ import annotations

import json
from collections import deque
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Tuple

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image

logger = get_logger(__name__)

MIN_TEXT_AREA = 250
MAX_TEXT_AREA = 15000
MAX_DIM = 800


@dataclass(frozen=True)
class TextRegion:
    id: str
    x: int
    y: int
    w: int
    h: int
    area: int


def _resize(image: Image.Image) -> Tuple[Image.Image, float]:
    width, height = image.size
    if max(width, height) <= MAX_DIM:
        return image, 1.0
    scale = MAX_DIM / max(width, height)
    resized = image.resize(
        (max(1, int(width * scale)), max(1, int(height * scale))),
        resample=Image.Resampling.BILINEAR,
    )
    return resized, scale


def _binary_mask(image: Image.Image, threshold: int = 180) -> Image.Image:
    gray = image.convert("L")
    return gray.point(lambda v: 255 if v < threshold else 0)


def _find_components(mask: Image.Image) -> List[Tuple[int, int, int, int, int]]:
    width, height = mask.size
    pixels = mask.load()
    visited = [[False] * width for _ in range(height)]
    components: List[Tuple[int, int, int, int, int]] = []

    for y in range(height):
        for x in range(width):
            if visited[y][x] or pixels[x, y] == 0:
                continue
            queue = deque([(x, y)])
            visited[y][x] = True
            min_x, min_y, max_x, max_y = x, y, x, y
            area = 0
            while queue:
                cx, cy = queue.popleft()
                area += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)
                for nx, ny in (
                    (cx - 1, cy),
                    (cx + 1, cy),
                    (cx, cy - 1),
                    (cx, cy + 1),
                ):
                    if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                        if pixels[nx, ny] != 0:
                            visited[ny][nx] = True
                            queue.append((nx, ny))
                        else:
                            visited[ny][nx] = True
            components.append((min_x, min_y, max_x, max_y, area))
    return components


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    preprocess = context.get("preprocess", {})
    source_path = get_latest_output_path(preprocess, "text-detection-input")
    regions: List[TextRegion] = []
    debug_path = None

    scale = 1.0
    if source_path:
        try:
            with Image.open(source_path) as image:
                resized, scale = _resize(image)
                mask = _binary_mask(resized)
                components = _find_components(mask)
                idx = 1
                for x1, y1, x2, y2, area in components:
                    width = x2 - x1 + 1
                    height = y2 - y1 + 1
                    if area < MIN_TEXT_AREA or area > MAX_TEXT_AREA:
                        continue
                    regions.append(
                        TextRegion(
                            f"text-{idx}",
                            x1,
                            y1,
                            width,
                            height,
                            area,
                        )
                    )
                    idx += 1
        except (OSError, ValueError) as exc:
            logger.warning("Failed to detect text regions", extra={"path": source_path, "error": str(exc)})

    if regions and settings.debug_artifacts_enabled:
        debug_dir = Path(settings.debug_artifacts_dir)
        debug_dir.mkdir(parents=True, exist_ok=True)
        path = debug_dir / "text-regions.json"
        try:
            path.write_text(
                json.dumps([asdict(item) for item in regions], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            debug_path = str(path)
        except OSError as exc:
            logger.warning("Failed to write text region debug payload", extra={"error": str(exc)})

    context.setdefault("meta", {})
    context["meta"]["text_regions"] = [asdict(item) for item in regions]
    context["meta"]["text_regions_scale"] = scale

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "detect-text",
                "level": "info",
                "message": f"detected {len(regions)} text regions",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "detect-text",
                "kind": "detected-text",
                "meta": {"count": len(regions), "source": source_path},
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
