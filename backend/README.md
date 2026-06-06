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
OPENROUTER_API_KEY=
OPENROUTER_AI_API_KEY=
OPENROUTER_AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_PDF_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
OPENROUTER_URL_MODEL=nvidia/nemotron-3-super-120b-a12b:free
SCRAPEDO_API_KEY=
SCRAPEDO_BASE_URL=http://api.scrape.do/
GENERATION_TIMEOUT_SECONDS=90
PDF_MAX_UPLOAD_MB=10
MAX_URL_CONTENT_LENGTH=50000
SUPABASE_URL=
SUPABASE_ANON_KEY=
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
- `POST /api/ai-quiz/generate`
- `POST /api/pdf-quiz/upload`
- `POST /api/pdf-quiz/generate`
- `POST /api/quiz/generate`
- `POST /api/quiz/upload`
- `POST /api/quiz/generate-from-file`
- `POST /api/quiz/verify`
- `POST /api/url-quiz/extract`
- `POST /api/url-quiz/generate`
- `POST /api/url-quiz/verify`
- `POST /api/multiplayer/create-room`
- `POST /api/multiplayer/join-room`
- `POST /api/multiplayer/start`

The text AI quiz endpoint calls OpenRouter using `OPENROUTER_AI_API_KEY` and `OPENROUTER_AI_MODEL`, defaulting to `nvidia/nemotron-3-ultra-550b-a55b:free`.
The PDF/PPT file generation endpoint uses `OPENROUTER_PDF_MODEL`, defaulting to `nvidia/nemotron-3-nano-30b-a3b:free`.
The URL quiz endpoint extracts pages through Scrape.do and uses `OPENROUTER_URL_MODEL`, defaulting to `nvidia/nemotron-3-super-120b-a12b:free`.
OpenRouter calls are async, pooled, retried up to three times, validated as structured quiz JSON, repaired on malformed output, and briefly cached for identical generation requests.
Generation is capped by `GENERATION_TIMEOUT_SECONDS` and returns a clean timeout message if the provider is slow.

PDF upload extraction uses PyMuPDF. PPTX extraction uses python-pptx. Run `supabase/ai_file_quiz_schema.sql`
to add generated quiz and room persistence tables.

## Supabase

The backend uses `SUPABASE_SERVICE_ROLE_KEY` only on the server. Do not copy that key into any frontend env file.
