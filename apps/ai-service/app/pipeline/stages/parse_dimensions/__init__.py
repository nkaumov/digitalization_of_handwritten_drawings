"""Stage domain: parse-dimensions."""

from __future__ import annotations

import json
import os
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.preprocess import get_latest_output_path
from app.pipeline.types import PipelineStageInput, PipelineStageOutput
from PIL import Image, ImageFilter, ImageOps

logger = get_logger(__name__)

_DIGIT_RE = re.compile(r"[0-9]+(?:[.,][0-9]+)?")
_MIN_CONFIDENCE = 60
_UPSCALE = 3


@dataclass(frozen=True)
class OcrRegionResult:
    id: str
    x: int
    y: int
    w: int
    h: int
    raw: str
    confidence: float | None
    values: List[float]


def _normalize_decimal(value: str) -> str:
    return value.replace(",", ".")


def _safe_parse(value: str) -> float | None:
    try:
        return float(_normalize_decimal(value))
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
    width, height = image.size
    x = int(region["x"] / scale)
    y = int(region["y"] / scale)
    w = int(region["w"] / scale)
    h = int(region["h"] / scale)
    pad = max(2, int(6 / max(scale, 0.1)))
    left = max(0, x - pad)
    top = max(0, y - pad)
    right = min(width, x + w + pad)
    bottom = min(height, y + h + pad)
    return image.crop((left, top, right, bottom))


def _prepare_crop(crop: Image.Image) -> Image.Image:
    gray = ImageOps.autocontrast(crop.convert("L"))
    gray = gray.filter(ImageFilter.MedianFilter(3))
    gray = gray.point(lambda v: 255 if v > 150 else 0)
    if _UPSCALE > 1:
        width, height = gray.size
        gray = gray.resize(
            (max(1, width * _UPSCALE), max(1, height * _UPSCALE)),
            resample=Image.Resampling.BILINEAR,
        )
    return gray


def _prepare_full(image: Image.Image) -> Image.Image:
    gray = ImageOps.autocontrast(image.convert("L"))
    gray = gray.filter(ImageFilter.MedianFilter(3))
    if _UPSCALE > 1:
        width, height = gray.size
        gray = gray.resize(
            (max(1, width * _UPSCALE), max(1, height * _UPSCALE)),
            resample=Image.Resampling.BILINEAR,
        )
    return gray


def _resolve_tesseract_cmd() -> str | None:
    env_cmd = os.getenv("AI_SERVICE_TESSERACT_CMD")
    if env_cmd:
        return env_cmd
    default_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if Path(default_path).exists():
        return default_path
    return None


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

    tesseract_cmd = _resolve_tesseract_cmd()
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        with Image.open(source_path) as image:
            for region in regions:
                crop = _crop_region(image, region, scale)
                prepared = _prepare_crop(crop)
                raw = pytesseract.image_to_string(
                    prepared,
                    config="--psm 7 -c tessedit_char_whitelist=0123456789,.",
                ).strip()
                data = pytesseract.image_to_data(
                    prepared,
                    config="--psm 7 -c tessedit_char_whitelist=0123456789,.",
                    output_type=pytesseract.Output.DICT,
                )
                confidences = [
                    float(conf)
                    for conf in data.get("conf", [])
                    if conf not in ("-1", "") and float(conf) >= 0
                ]
                confidence = sum(confidences) / len(confidences) if confidences else None
                values = _extract_values(raw)
                results.append(
                    OcrRegionResult(
                        id=region.get("id", ""),
                        x=region.get("x", 0),
                        y=region.get("y", 0),
                        w=region.get("w", 0),
                        h=region.get("h", 0),
                        raw=raw,
                        confidence=confidence,
                        values=values,
                    )
                )

            prepared = _prepare_full(image)
            raw_full = pytesseract.image_to_string(
                prepared,
                config="--psm 6 -c tessedit_char_whitelist=0123456789,.",
            ).strip()
            data_full = pytesseract.image_to_data(
                prepared,
                config="--psm 6 -c tessedit_char_whitelist=0123456789,.",
                output_type=pytesseract.Output.DICT,
            )
            confidences_full = [
                float(conf)
                for conf in data_full.get("conf", [])
                if conf not in ("-1", "") and float(conf) >= 0
            ]
            confidence_full = sum(confidences_full) / len(confidences_full) if confidences_full else None
            values_full = _extract_values(raw_full)
            if values_full or raw_full:
                results.append(
                    OcrRegionResult(
                        id="full",
                        x=0,
                        y=0,
                        w=image.size[0],
                        h=image.size[1],
                        raw=raw_full,
                        confidence=confidence_full,
                        values=values_full,
                    )
                )
    except (OSError, ValueError) as exc:
        logger.warning("OCR failed", extra={"error": str(exc)})

    raw_entries = [asdict(item) for item in results]
    candidates = []
    suspicious = []
    for item in results:
        if not item.values:
            if item.raw:
                suspicious.append(
                    {
                        "region_id": item.id,
                        "raw": item.raw,
                        "confidence": item.confidence,
                        "reason": "no_values",
                    }
                )
            continue
        if item.confidence is not None and item.confidence < _MIN_CONFIDENCE:
            suspicious.append(
                {
                    "region_id": item.id,
                    "raw": item.raw,
                    "values": item.values,
                    "confidence": item.confidence,
                    "reason": "low_confidence",
                }
            )
            continue
        candidates.append(
            {
                "region_id": item.id,
                "values": item.values,
                "raw": item.raw,
                "confidence": item.confidence,
            }
        )

    context.setdefault("meta", {})
    context["meta"]["ocr_raw"] = raw_entries
    context["meta"]["ocr_candidates"] = candidates
    context["meta"]["ocr_suspicious"] = suspicious
    context["meta"]["ocr_confidence_threshold"] = _MIN_CONFIDENCE
    context["meta"]["ocr_tesseract_cmd"] = tesseract_cmd

    if settings.debug_artifacts_enabled:
        debug_dir = Path(settings.debug_artifacts_dir)
        debug_dir.mkdir(parents=True, exist_ok=True)
        path = debug_dir / "ocr-results.json"
        try:
            payload = {
                "raw": raw_entries,
                "candidates": candidates,
                "suspicious": suspicious,
                "confidence_threshold": _MIN_CONFIDENCE,
                "tesseract_cmd": tesseract_cmd,
            }
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
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
                    "suspicious": len(suspicious),
                    "source": source_path,
                },
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
