from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.quiz import router as quiz_router
from app.core.config import get_settings
from app.sockets.server import sio

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
