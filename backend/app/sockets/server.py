import socketio
import logging

from app.core.config import get_settings
from app.services.room_service import RoomError, room_service

settings = get_settings()
logger = logging.getLogger("genquiz.socket")

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.frontend_urls,
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid, environ):
    logger.info("socket connected sid=%s origin=%s", sid, environ.get("HTTP_ORIGIN", "unknown"))
    await sio.emit("system:ready", {"message": "GENQUIZ realtime channel ready"}, to=sid)


@sio.event
async def create_room(sid, data):
    try:
        room = await room_service.create_room(data.get("room_code"), sid)
        await sio.enter_room(sid, room.code)
        payload = room.model_dump()
        logger.info("room created code=%s host_sid=%s", room.code, sid)
        await sio.emit("room_updated", payload, room=room.code)
        return {"ok": True, "room": payload}
    except RoomError as exc:
        await sio.emit("room_invalid", {"message": exc.message}, to=sid)
        return {"ok": False, "message": exc.message}


@sio.event
async def join_room(sid, data):
    try:
        participant_id, room = await room_service.join_room(data.get("room_code"), sid)
        await sio.enter_room(sid, room.code)
        payload = room.model_dump()
        logger.info("participant joined code=%s participant_sid=%s count=%s", room.code, sid, room.participant_count)
        await sio.emit("room_joined", {"participant_id": participant_id, "room": payload}, to=sid)
        await sio.emit("participant_joined", {"participant_id": participant_id, "room_code": room.code}, room=room.code)
        await sio.emit("room_updated", payload, room=room.code)
        return {"ok": True, "participant_id": participant_id, "room": payload}
    except RoomError as exc:
        await sio.emit("room_invalid", {"message": exc.message}, to=sid)
        return {"ok": False, "message": exc.message}


@sio.event
async def update_name(sid, data):
    try:
        room = await room_service.update_name(sid, data.get("name"))
        payload = room.model_dump()
        logger.info("participant renamed code=%s sid=%s", room.code, sid)
        await sio.emit("room_updated", payload, room=room.code)
        return {"ok": True, "room": payload}
    except RoomError as exc:
        return {"ok": False, "message": exc.message}


@sio.event
async def start_room(sid, data):
    try:
        room = await room_service.start_room(sid, data.get("room_code"))
        payload = room.model_dump()
        logger.info("room started code=%s host_sid=%s", room.code, sid)
        await sio.emit("quiz_started", payload, room=room.code)
        await sio.emit("room_updated", payload, room=room.code)
        return {"ok": True, "room": payload}
    except RoomError as exc:
        return {"ok": False, "message": exc.message}


@sio.event
async def leave_room(sid, data):
    code, was_host, room = await room_service.remove_sid(sid)
    if code:
        await sio.leave_room(sid, code)
        if was_host:
            await sio.emit("room_closed", {"room_code": code, "message": "Host closed the arena."}, room=code)
        elif room:
            await sio.emit("participant_left", {"participant_id": sid, "room_code": code}, room=code)
            await sio.emit("room_updated", room.model_dump(), room=code)
    return {"ok": True}


@sio.event
async def close_room(sid, data):
    code = await room_service.close_room(sid, data.get("room_code"))
    if code:
        await sio.emit("room_closed", {"room_code": code, "message": "Host closed the arena."}, room=code)
        await sio.close_room(code)
    return {"ok": True}


@sio.event
async def disconnect(sid):
    logger.info("socket disconnected sid=%s", sid)
    code, was_host, room = await room_service.remove_sid(sid)
    if not code:
        return

    if was_host:
        await sio.emit("room_closed", {"room_code": code, "message": "Host disconnected."}, room=code)
        await sio.close_room(code)
    elif room:
        await sio.emit("participant_left", {"participant_id": sid, "room_code": code}, room=code)
        await sio.emit("room_updated", room.model_dump(), room=code)
