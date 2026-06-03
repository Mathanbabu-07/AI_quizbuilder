# GENQUIZ Deployment

## Frontend: Vercel

Set the Vercel project root to `frontend`.

Required Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://genquiz-backend-exz2.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://genquiz-backend-exz2.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_ALLOWED_DEV_ORIGINS=https://your-vercel-frontend.example.com
```

Build command:

```bash
npm run build
```

## Backend: Render

Set the Render root directory to `backend`, or use the root `render.yaml`.

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required Render environment variables:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_PDF_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
OPENROUTER_URL_MODEL=openai/gpt-oss-120b:free
OPENROUTER_URL_FALLBACK_MODEL=nvidia/nemotron-3-super-120b-a12b:free
SCRAPEDO_API_KEY=your-scrapedo-api-key
GENERATION_TIMEOUT_SECONDS=120
PDF_MAX_UPLOAD_MB=10
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
FRONTEND_URL=https://your-vercel-frontend.example.com
FRONTEND_URLS=https://your-vercel-frontend.example.com
```

`FRONTEND_URLS` accepts comma-separated origins if you need preview domains.

## Supabase Schema

Before using the manual quiz builder, run this SQL file in the Supabase SQL editor:

```text
supabase/schema.sql
```

The backend stores and reads manual quizzes through `SUPABASE_SERVICE_ROLE_KEY`.
Saved quizzes are filtered by a device-scoped `host_id`, so one browser/device will not list another device's saved quizzes.

## Health Check

Backend health endpoint:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- Only `NEXT_PUBLIC_*` values are sent to the browser.
- Keep real `.env` files out of Git.
- Vercel must point to the Render backend URL for both API and Socket.IO.
