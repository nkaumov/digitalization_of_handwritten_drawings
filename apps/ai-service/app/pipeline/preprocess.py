from __future__ import annotations

import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from app.pipeline.contracts import PreprocessContext


def _to_iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def _safe_filename(value: str) -> str:
    return value.replace(":", "_").replace("/", "_").replace("\\", "_")


def build_preprocess_context(image_path: str) -> PreprocessContext:
    path = Path(image_path)
    notes: list[str] = []
    outputs: list[dict[str, str | None]] = []
    mime_type = mimetypes.guess_type(path.name)[0]

    if not path.exists():
        notes.append("file not found")
        return {
            "image_path": image_path,
            "exists": False,
            "size_bytes": None,
            "mime_type": mime_type,
            "extension": path.suffix.lower() or None,
            "created_at_iso": None,
            "modified_at_iso": None,
            "width": None,
            "height": None,
            "notes": notes,
            "outputs": outputs,
        }

    stat = path.stat()
    return {
        "image_path": image_path,
        "exists": True,
        "size_bytes": stat.st_size,
        "mime_type": mime_type,
        "extension": path.suffix.lower() or None,
        "created_at_iso": _to_iso(stat.st_ctime),
        "modified_at_iso": _to_iso(stat.st_mtime),
        "width": None,
        "height": None,
        "notes": notes,
        "outputs": outputs,
    }


def add_preprocess_output(
    preprocess: PreprocessContext,
    *,
    kind: str,
    path: str | None,
    note: str | None = None,
) -> None:
    outputs = preprocess.get("outputs")
    if outputs is None:
        outputs = []
        preprocess["outputs"] = outputs
    outputs.append(
        {
            "kind": kind,
            "path": path,
            "note": note,
        }
    )


def get_latest_output_path(preprocess: PreprocessContext, kind: str) -> str | None:
    outputs = preprocess.get("outputs") or []
    for item in reversed(outputs):
        if item.get("kind") == kind and item.get("path"):
            return str(item.get("path"))
    return None


def persist_preprocess_snapshot(
    preprocess: PreprocessContext,
    *,
    runtime: dict | None,
    stage: str,
) -> str | None:
    from app.core.config import settings
    from app.core.logger import get_logger

    if not settings.debug_artifacts_enabled:
        return None

    debug_dir = settings.debug_artifacts_dir
    if not debug_dir:
        return None

    logger = get_logger(__name__)
    chain_id = _safe_filename(str((runtime or {}).get("chain_id", "chain")))
    run_id = _safe_filename(str((runtime or {}).get("run_id", "run")))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")

    payload = {
        "stage": stage,
        "runtime": {
            "chain_id": (runtime or {}).get("chain_id"),
            "run_id": (runtime or {}).get("run_id"),
            "triggered_by": (runtime or {}).get("triggered_by"),
        },
        "preprocess": preprocess,
    }

    target_dir = Path(debug_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"preprocess-{stage}-{chain_id}-{run_id}-{timestamp}.json"
    path = target_dir / filename
    try:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as exc:
        logger.warning(
            "Failed to persist preprocess snapshot",
            extra={"path": str(path), "error": str(exc)},
        )
        return None

    return str(path)
