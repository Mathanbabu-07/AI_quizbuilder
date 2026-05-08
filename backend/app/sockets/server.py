import socketio

from app.core.config import get_settings

settings = get_settings()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.frontend_origin, "http://localhost:3000", "http://localhost:3001"],
)


@sio.event
async def connect(sid, environ):
    await sio.emit("system:ready", {"message": "GENQUIZ realtime channel ready"}, to=sid)


@sio.event
async def quiz_join(sid, data):
    room = data.get("room", "default")
    await sio.enter_room(sid, room)
    await sio.emit("quiz:user_joined", {"sid": sid, "room": room}, room=room)


@sio.event
async def disconnect(sid):
    pass
