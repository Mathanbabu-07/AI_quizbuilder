# GENQUIZ Backend

FastAPI backend for AI quiz generation through OpenRouter.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set environment variables from `.env.example`.

Optional performance settings:

```env
OPENROUTER_MODEL=openai/gpt-oss-120b:free
GENERATION_TIMEOUT_SECONDS=120
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
FRONTEND_URLS=
```

## Run

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`app.main:app` serves FastAPI and Socket.IO from one ASGI app.

## API

- `GET /health`
- `POST /api/quiz/generate`

The generation endpoint calls OpenRouter using `OPENROUTER_MODEL`, defaulting to `openai/gpt-oss-120b:free`.
Generation is capped by `GENERATION_TIMEOUT_SECONDS` and returns a clean timeout message if the provider is slow.

## Supabase

The backend uses `SUPABASE_SERVICE_ROLE_KEY` only on the server. Do not copy that key into any frontend env file.
