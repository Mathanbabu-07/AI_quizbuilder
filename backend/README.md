# GENQUIZ Backend

FastAPI backend for AI quiz generation through OpenRouter.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set `OPENROUTER_API_KEY` in `.env`.

## Run

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:socket_app --host 0.0.0.0 --port 8000
```

## API

- `GET /health`
- `POST /api/quiz/generate`

The generation endpoint calls OpenRouter using `OPENROUTER_MODEL`, defaulting to `openai/gpt-oss-120b:free`.
