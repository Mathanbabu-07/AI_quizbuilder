import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.quiz import router as quiz_router
from app.core.config import get_settings
from app.sockets.server import sio

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("genquiz.api")

fastapi_app = FastAPI(title=settings.app_name)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.include_router(quiz_router)


@fastapi_app.middleware("http")
async def log_requests(request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info("%s %s -> %s %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@fastapi_app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# Render should run `uvicorn app.main:app ...`; this ASGI app includes both
# FastAPI HTTP routes and Socket.IO websocket/polling routes.
app = socket_app
