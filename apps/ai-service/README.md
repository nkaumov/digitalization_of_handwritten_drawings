# AI Service Skeleton

Python FastAPI skeleton for the future recognition service.

## Scope

Implemented:
- FastAPI app bootstrap
- env config
- logger
- GET /health
- pipeline runner placeholder
- stage structure for future pipeline
- separation of production code and research artifacts

Not implemented:
- OCR
- OpenCV logic
- real recognition pipeline
- backend integration

## Run

```bash
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Run from project root:

```bash
npm run dev:ai
```

Health endpoint:
- http://127.0.0.1:8001/health

## Local pipeline test run

Full run (placeholder stages):

```bash
python -m app.pipeline.cli C:\path\to\image.jpg --drawing-id drawing_local
```

List stages:

```bash
python -m app.pipeline.cli --list-stages
```

Step debug (single stage or up to stage):

```bash
python -m app.pipeline.cli C:\path\to\image.jpg --stage detect-lines --step
python -m app.pipeline.cli C:\path\to\image.jpg --until find-contours --pause
```

## Preprocess fixtures

Local fixture set for comparing preprocessing results:

```bash
python apps/ai-service/scripts/run_preprocess_fixtures.py
```

Fixtures live in `apps/ai-service/preprocess_fixtures`.

## Stage 10 graph fixtures

Local fixture set for checking graph/contour grouping:

```bash
python apps/ai-service/scripts/run_stage10_fixtures.py
```

Fixtures live in `apps/ai-service/graph_fixtures`.

## OCR fixtures

Local fixture set for numeric OCR comparisons:

```bash
python apps/ai-service/scripts/run_ocr_fixtures.py
```

Fixtures live in `apps/ai-service/ocr_fixtures`.
