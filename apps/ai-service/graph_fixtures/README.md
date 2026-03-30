# Graph Fixtures

Local fixture set for validating stage 10 (line detection + graph/contour grouping).

## Structure

- `images/` — local input images (not tracked).
- `outputs/` — generated artifacts (not tracked).
- `reports/` — comparison reports (not tracked).
- `manifest.json` — fixture manifest (tracked).

## Workflow

1. Put images into `images/`.
2. Update `manifest.json` with expected contour info.
3. Run:

```bash
python apps/ai-service/scripts/run_stage10_fixtures.py
```

The script generates:
- per-image debug artifacts in `outputs/<run-id>/`
- JSON + Markdown report in `reports/`

## Manifest format

```json
{
  "version": "1",
  "items": [
    {
      "id": "rectangle-01",
      "path": "images/rectangle-01.png",
      "expected": {
        "contours": 1,
        "closed": 1
      },
      "note": "simple rectangle"
    }
  ]
}
```
