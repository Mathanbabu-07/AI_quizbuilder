import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.ai_quiz import router as ai_quiz_router
from app.api.emoji_rush import router as emoji_rush_router
from app.api.hand_cricket import router as hand_cricket_router
from app.api.manual_quizzes import router as manual_quizzes_router
from app.api.memory_grid import router as memory_grid_router
from app.api.multiplayer import router as multiplayer_router
from app.api.pdf_quiz import router as pdf_quiz_router
from app.api.quiz import router as quiz_router
from app.api.url_quiz import router as url_quiz_router
from app.core.config import get_settings
from app.services.supabase_client import get_supabase_diagnostics
from app.sockets.server import sio

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("genquiz.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    route_summary = [
        f"{','.join(sorted(route.methods or []))} {route.path}"
        for route in app.routes
        if hasattr(route, "methods")
    ]
    logger.info("GENQUIZ backend ready")
    logger.info("FastAPI routes registered: %s", route_summary)
    logger.info("Socket.IO ASGI endpoint mounted at /socket.io")
    logger.info("CORS origins=%s regex=%s", settings.frontend_urls, settings.cors_allow_origin_regex)
    logger.info("Supabase diagnostics: %s", get_supabase_diagnostics())
    yield


fastapi_app = FastAPI(title=settings.app_name, lifespan=lifespan)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_urls,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.include_router(ai_quiz_router)
fastapi_app.include_router(pdf_quiz_router)
fastapi_app.include_router(url_quiz_router)
fastapi_app.include_router(quiz_router)
fastapi_app.include_router(manual_quizzes_router)
fastapi_app.include_router(hand_cricket_router)
fastapi_app.include_router(emoji_rush_router)
fastapi_app.include_router(memory_grid_router)
fastapi_app.include_router(multiplayer_router)


@fastapi_app.middleware("http")
async def log_requests(request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info("%s %s -> %s %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@fastapi_app.api_route("/", methods=["GET", "HEAD"], tags=["system"])
async def root(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)

    return {"message": "GENQUIZ backend running"}


@fastapi_app.api_route("/health", methods=["GET", "HEAD"], tags=["system"])
async def health(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)

    return {
        "status": "ok",
        "supabase": get_supabase_diagnostics(),
        "manual_storage": "supabase_rest_http1",
        "emoji_rush_storage": "supabase_rest_http1",
        "memory_grid_storage": "supabase_rest_http1",
        "ai_quiz_model": settings.openrouter_model,
        "pdf_quiz_model": settings.openrouter_file_model,
        "url_quiz_model": settings.openrouter_url_model,
        "url_quiz_fallback_model": settings.openrouter_url_fallback_model,
        "url_quiz_extraction": "scrapedo",
    }


@fastapi_app.api_route("/api/health", methods=["GET", "HEAD"], tags=["system"])
async def api_health(request: Request):
    return await health(request)


socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io",
)

# Render should run `uvicorn app.main:app ...`; this ASGI app includes both
# FastAPI HTTP routes and Socket.IO websocket/polling routes.
app = socket_app
