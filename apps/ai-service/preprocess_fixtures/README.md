# Preprocess Fixtures

Local fixture set for validating preprocessing quality (stage 9).

## Structure

- `images/` — local input images (not tracked).
- `outputs/` — generated preprocessing outputs (not tracked).
- `reports/` — comparison reports (not tracked).
- `manifest.json` — fixture manifest (tracked).

## Workflow

1. Put sample images into `images/`.
2. Add entries to `manifest.json`.
3. Run:

```bash
python apps/ai-service/scripts/run_preprocess_fixtures.py
```

The script creates:
- per-image preprocessing outputs in `outputs/<run-id>/`
- a JSON + Markdown report in `reports/`

## Manifest format

```json
{
  "version": "1",
  "items": [
    {
      "id": "sample-01",
      "path": "images/sample-01.jpg",
      "note": "clean scan"
    }
  ]
}
```
