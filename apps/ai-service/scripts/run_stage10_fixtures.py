from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

APP_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP_ROOT))

STAGE10_ORDER = [
    "normalize-image",
    "denoise-image",
    "deskew-image",
    "prepare-line-image",
    "detect-lines",
    "build-graph",
]


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_manifest(path: Path) -> Dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    items = payload.get("items", [])
    if not isinstance(items, list):
        raise ValueError("Manifest items must be a list")
    return payload


def _resolve_image_path(manifest_path: Path, item_path: str) -> Path:
    candidate = Path(item_path)
    if candidate.is_absolute():
        return candidate
    return (manifest_path.parent / candidate).resolve()


def _report_path(reports_dir: Path, suffix: str) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    return reports_dir / f"stage10-report-{timestamp}.{suffix}"


def _build_manager(outputs_dir: Path):
    from app.core.config import settings
    from app.pipeline.config import PipelineConfig
    from app.pipeline.hooks_registry import build_placeholder_hook_manager
    from app.pipeline.manager import PipelineManager
    from app.pipeline.stages.implementations import build_default_stage_catalog
    from app.pipeline.stages.registry import build_pipeline_stage_registry

    settings.debug_artifacts_enabled = True
    settings.debug_artifacts_dir = str(outputs_dir)

    config = PipelineConfig(
        stage_order=list(STAGE10_ORDER),
        continue_on_stage_failure=settings.pipeline_continue_on_stage_failure,
    )
    registry = build_pipeline_stage_registry(config, catalog=build_default_stage_catalog())
    return PipelineManager(
        registry,
        continue_on_stage_failure=config.continue_on_stage_failure,
        hook_manager=build_placeholder_hook_manager(),
        default_triggered_by="fixtures.stage10",
    )


def _write_markdown(report_path: Path, report: Dict[str, Any]) -> None:
    lines = [
        "# Stage 10 Fixture Report",
        "",
        f"- Generated at: {report['generated_at']}",
        f"- Manifest: {report['manifest_path']}",
        f"- Outputs dir: {report['outputs_dir']}",
        "",
        "| id | image | contours | closed | expected | status |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for item in report["items"]:
        expected = item.get("expected", {})
        expected_str = f"{expected.get('contours')} / {expected.get('closed')}"
        row = [
            item.get("id", "-"),
            item.get("image_path", "-"),
            str(item.get("contours", "-")),
            str(item.get("closed", "-")),
            expected_str,
            item.get("status", "-"),
        ]
        lines.append("| " + " | ".join(row) + " |")
    report_path.write_text("\n".join(lines), encoding="utf-8")


def run(manifest_path: Path, outputs_dir: Path, reports_dir: Path) -> int:
    manifest = _load_manifest(manifest_path)
    items = manifest.get("items", [])

    outputs_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    manager = _build_manager(outputs_dir)
    report_items = []

    for item in items:
        item_id = str(item.get("id") or "unknown")
        image_path = _resolve_image_path(manifest_path, str(item.get("path") or ""))
        expected = item.get("expected", {})

        if not image_path.exists():
            report_items.append(
                {
                    "id": item_id,
                    "image_path": str(image_path),
                    "status": "missing",
                    "expected": expected,
                }
            )
            continue

        context = {
            "image_path": str(image_path),
            "drawing_id": f"drawing_fixture_{item_id}",
            "target_unit": "mm",
            "warnings": [],
            "stage_notes": [],
            "debug_artifacts": [],
            "stage_trace": [],
            "meta": {"fixture_id": item_id},
            "payload": {
                "version": "1.0",
                "drawingId": f"drawing_fixture_{item_id}",
                "unit": "mm",
                "contours": [],
                "warnings": [],
                "confidence": None,
            },
        }

        result = manager.run(context, triggered_by="fixtures.stage10")
        contours = result.context.get("meta", {}).get("graph_contours", [])
        closed = sum(1 for contour in contours if contour.get("closed"))

        expected_contours = expected.get("contours")
        expected_closed = expected.get("closed")
        matches = True
        if expected_contours is not None and expected_contours != len(contours):
            matches = False
        if expected_closed is not None and expected_closed != closed:
            matches = False

        report_items.append(
            {
                "id": item_id,
                "image_path": str(image_path),
                "contours": len(contours),
                "closed": closed,
                "expected": expected,
                "status": "ok" if matches else "mismatch",
                "warnings": len(result.context.get("warnings", [])),
            }
        )

    report = {
        "generated_at": _iso_now(),
        "manifest_path": str(manifest_path),
        "outputs_dir": str(outputs_dir),
        "items": report_items,
    }

    json_path = _report_path(reports_dir, "json")
    md_path = _report_path(reports_dir, "md")
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    _write_markdown(md_path, report)

    print(f"Report: {json_path}")
    print(f"Report (md): {md_path}")
    return 0


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run stage-10 fixtures")
    parser.add_argument(
        "--manifest",
        default=str(APP_ROOT / "graph_fixtures" / "manifest.json"),
        help="Path to manifest.json",
    )
    parser.add_argument(
        "--outputs-dir",
        default=str(APP_ROOT / "graph_fixtures" / "outputs"),
        help="Directory for outputs",
    )
    parser.add_argument(
        "--reports-dir",
        default=str(APP_ROOT / "graph_fixtures" / "reports"),
        help="Directory for reports",
    )
    args = parser.parse_args(argv)

    manifest_path = Path(args.manifest).resolve()
    outputs_dir = Path(args.outputs_dir).resolve()
    reports_dir = Path(args.reports_dir).resolve()

    if not manifest_path.exists():
        print(f"Manifest not found: {manifest_path}")
        return 1

    return run(manifest_path, outputs_dir, reports_dir)


if __name__ == "__main__":
    raise SystemExit(main())
