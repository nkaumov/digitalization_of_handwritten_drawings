"""Stage domain: parse-dimensions."""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image

logger = get_logger(__name__)

_DIGIT_RE = re.compile(r"[0-9]+(?:[.,][0-9]+)?")


@dataclass(frozen=True)
class OcrRegionResult:
    id: str
    x: int
    y: int
    w: int
    h: int
    raw: str
    values: List[float]


def _safe_parse(value: str) -> float | None:
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return None


def _extract_values(text: str) -> List[float]:
    values: List[float] = []
    for match in _DIGIT_RE.findall(text):
        parsed = _safe_parse(match)
        if parsed is not None:
            values.append(parsed)
    return values


def _crop_region(image: Image.Image, region: dict, scale: float) -> Image.Image:
    x = int(region["x"] / scale)
    y = int(region["y"] / scale)
    w = int(region["w"] / scale)
    h = int(region["h"] / scale)
    return image.crop((x, y, x + w, y + h))


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    meta = context.get("meta", {})
    regions = meta.get("text_regions", [])
    scale = float(meta.get("text_regions_scale") or 1.0)
    source_path = get_latest_output_path(context.get("preprocess", {}), "text-detection-input")
    results: List[OcrRegionResult] = []
    debug_path = None

    if not regions:
        return {
            "context": context,
            "stage_notes": [
                {
                    "stage": "parse-dimensions",
                    "level": "warning",
                    "message": "no text regions available",
                }
            ],
            "debug_artifacts": [
                {
                    "stage": "parse-dimensions",
                    "kind": "parsed-dimensions",
                    "meta": {"placeholder": False, "regions": 0},
                }
            ],
        }

    if not source_path:
        return {
            "context": context,
            "stage_notes": [
                {
                    "stage": "parse-dimensions",
                    "level": "warning",
                    "message": "no text detection input available",
                }
            ],
            "debug_artifacts": [
                {
                    "stage": "parse-dimensions",
                    "kind": "parsed-dimensions",
                    "meta": {"placeholder": False, "regions": len(regions)},
                }
            ],
        }

    try:
        import pytesseract
    except ImportError:
        logger.warning("pytesseract is not installed; OCR skipped")
        context.setdefault("meta", {})
        context["meta"]["ocr_raw"] = []
        context["meta"]["ocr_candidates"] = []
        return {
            "context": context,
            "stage_notes": [
                {
                    "stage": "parse-dimensions",
                    "level": "warning",
                    "message": "pytesseract not installed",
                }
            ],
            "debug_artifacts": [
                {
                    "stage": "parse-dimensions",
                    "kind": "parsed-dimensions",
                    "meta": {"placeholder": False, "regions": len(regions), "ocr": "missing"},
                }
            ],
        }

    try:
        with Image.open(source_path) as image:
            for region in regions:
                crop = _crop_region(image, region, scale)
                raw = pytesseract.image_to_string(
                    crop,
                    config="--psm 7 -c tessedit_char_whitelist=0123456789,.",
                ).strip()
                values = _extract_values(raw)
                results.append(
                    OcrRegionResult(
                        id=region.get("id", ""),
                        x=region.get("x", 0),
                        y=region.get("y", 0),
                        w=region.get("w", 0),
                        h=region.get("h", 0),
                        raw=raw,
                        values=values,
                    )
                )
    except (OSError, ValueError) as exc:
        logger.warning("OCR failed", extra={"error": str(exc)})

    raw_entries = [asdict(item) for item in results]
    candidates = [
        {
            "region_id": item.id,
            "values": item.values,
            "raw": item.raw,
        }
        for item in results
        if item.values
    ]

    context.setdefault("meta", {})
    context["meta"]["ocr_raw"] = raw_entries
    context["meta"]["ocr_candidates"] = candidates

    if settings.debug_artifacts_enabled:
        debug_dir = Path(settings.debug_artifacts_dir)
        debug_dir.mkdir(parents=True, exist_ok=True)
        path = debug_dir / "ocr-results.json"
        try:
            path.write_text(json.dumps(raw_entries, ensure_ascii=False, indent=2), encoding="utf-8")
            debug_path = str(path)
        except OSError as exc:
            logger.warning("Failed to write OCR debug payload", extra={"error": str(exc)})

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "parse-dimensions",
                "level": "info",
                "message": f"OCR extracted {len(candidates)} candidate values",
            }
        ],
        "debug_artifacts": [
            {
                "stage": "parse-dimensions",
                "kind": "parsed-dimensions",
                "meta": {
                    "regions": len(results),
                    "candidates": len(candidates),
                    "source": source_path,
                },
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
