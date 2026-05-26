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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=qwen/qwen3-next-80b-a3b-instruct:free
OPENROUTER_FILE_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
GENERATION_TIMEOUT_SECONDS=90
MAX_UPLOAD_MB=25
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
- `POST /api/quiz/upload`
- `POST /api/quiz/generate-from-file`
- `POST /api/quiz/verify`
- `POST /api/multiplayer/create-room`
- `POST /api/multiplayer/join-room`
- `POST /api/multiplayer/start`

The text generation endpoint calls OpenRouter using `OPENROUTER_MODEL`.
The PDF/PPT file generation endpoint uses `OPENROUTER_FILE_MODEL`, defaulting to `nvidia/nemotron-3-nano-30b-a3b:free`.
Generation is capped by `GENERATION_TIMEOUT_SECONDS` and returns a clean timeout message if the provider is slow.

PDF upload extraction uses PyMuPDF. PPTX extraction uses python-pptx. Run `supabase/ai_file_quiz_schema.sql`
to add generated quiz and room persistence tables.

## Supabase

The backend uses `SUPABASE_SERVICE_ROLE_KEY` only on the server. Do not copy that key into any frontend env file.
