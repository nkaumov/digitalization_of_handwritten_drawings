# OCR Fixtures

Local fixture set for validating numeric OCR quality (stage 11).

## Structure

- `images/` — optional local images (not tracked).
- `outputs/` — generated artifacts (not tracked).
- `reports/` — comparison reports (not tracked).
- `manifest.json` — fixture manifest (tracked).

## Workflow

1. Update `manifest.json` with file paths and expected numeric values.
2. Run:

```bash
python apps/ai-service/scripts/run_ocr_fixtures.py
```

The script generates JSON + Markdown report in `reports/`.

## Manifest format

```json
{
  "version": "1",
  "items": [
    {
      "id": "sample-01",
      "path": "images/sample-01.jpg",
      "expected_values": [4.7, 590],
      "note": "decimal + integer"
    }
  ]
}
```
