from typing import Literal

from pydantic import BaseModel


RoomStatus = Literal["waiting", "started", "closed"]
ParticipantRole = Literal["host", "participant"]


class ParticipantState(BaseModel):
    id: str
    name: str
    role: ParticipantRole
    is_host: bool = False
    joined_at: float


class RoomState(BaseModel):
    code: str
    status: RoomStatus
    host_id: str
    participants: list[ParticipantState]
    participant_count: int
    created_at: float
