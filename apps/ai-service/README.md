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
