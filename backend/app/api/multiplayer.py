from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.multiplayer_service import create_persistent_room_async
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/multiplayer", tags=["multiplayer"])


class CreateRoomRequest(BaseModel):
    quiz_id: str | None = None
    host_name: str = Field(default="Host", min_length=1, max_length=40)


class CreateRoomResponse(BaseModel):
    room_code: str
    room_id: str | None = None


class JoinRoomRequest(BaseModel):
    room_id: str | None = None
    player_name: str = Field(default="Player", min_length=1, max_length=40)


class JoinRoomResponse(BaseModel):
    player_id: str | None = None


class StartRoomRequest(BaseModel):
    room_id: str | None = None
    room_code: str | None = None


class StartRoomResponse(BaseModel):
    ok: bool
    room_id: str | None = None
    room_code: str | None = None


@router.post("/create-room", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest) -> CreateRoomResponse:
    room_code, room_id = await create_persistent_room_async(quiz_id=request.quiz_id, host_name=request.host_name)
    return CreateRoomResponse(room_code=room_code, room_id=room_id)


@router.post("/join-room", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest) -> JoinRoomResponse:
    if not request.room_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="room_id is required for HTTP persistence join.")

    player_id = await supabase_service.add_room_player_async(room_id=request.room_id, player_name=request.player_name)
    return JoinRoomResponse(player_id=player_id)


@router.post("/start", response_model=StartRoomResponse)
async def start_room(request: StartRoomRequest) -> StartRoomResponse:
    # Real-time synchronized starts remain handled by Socket.IO `start_room`.
    # This endpoint exists for persistence-oriented clients and future REST fallbacks.
    return StartRoomResponse(ok=True, room_id=request.room_id, room_code=request.room_code)
