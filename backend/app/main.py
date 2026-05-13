import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.quiz import router as quiz_router
from app.core.config import get_settings
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
    yield


fastapi_app = FastAPI(title=settings.app_name, lifespan=lifespan)

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


@fastapi_app.api_route("/", methods=["GET", "HEAD"], tags=["system"])
async def root(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)

    return {"message": "GENQUIZ backend running"}


@fastapi_app.api_route("/health", methods=["GET", "HEAD"], tags=["system"])
async def health(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)

    return {"status": "ok"}


socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io",
)

# Render should run `uvicorn app.main:app ...`; this ASGI app includes both
# FastAPI HTTP routes and Socket.IO websocket/polling routes.
app = socket_app
