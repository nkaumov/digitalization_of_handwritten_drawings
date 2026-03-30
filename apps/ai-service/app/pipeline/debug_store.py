from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from app.core.logger import get_logger
from app.pipeline.types import PipelineStageResult

logger = get_logger(__name__)


def _safe_filename(value: str) -> str:
    return value.replace(":", "_").replace("/", "_").replace("\\", "_")


def build_debug_bundle(result: PipelineStageResult) -> Dict[str, Any]:
    runtime = result.context.get("runtime", {})
    return {
        "chainId": result.chain_id,
        "runId": runtime.get("run_id"),
        "triggeredBy": runtime.get("triggered_by"),
        "startedAtIso": result.started_at_iso,
        "finishedAtIso": result.finished_at_iso,
        "durationMs": result.duration_ms,
        "abortedByPolicy": result.aborted_by_policy,
        "completedStages": result.completed_stages,
        "stageTrace": result.context.get("stage_trace", []),
        "warnings": result.context.get("warnings", []),
        "stageNotes": result.context.get("stage_notes", []),
        "debugArtifacts": result.context.get("debug_artifacts", []),
        "errors": [asdict(error) for error in result.errors],
        "payload": result.context.get("payload", {}),
        "meta": result.context.get("meta", {}),
    }


def persist_debug_bundle(result: PipelineStageResult, debug_dir: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    chain_id = _safe_filename(result.chain_id)
    run_id = _safe_filename(result.context.get("runtime", {}).get("run_id", "run"))
    filename = f"pipeline-debug-{timestamp}-{chain_id}-{run_id}.json"

    target_dir = Path(debug_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    payload = build_debug_bundle(result)
    path = target_dir / filename
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info(
        "Pipeline debug bundle saved",
        extra={"path": str(path), "chain_id": result.chain_id},
    )
    return str(path)
