from __future__ import annotations

import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from app.pipeline.contracts import PreprocessContext


def _to_iso(ts: float | None) -> str | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


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
