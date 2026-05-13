from typing import Any, Literal

from pydantic import BaseModel, Field


RoomStatus = Literal["waiting", "started", "finished", "closed"]
ParticipantRole = Literal["host", "participant"]


class ParticipantState(BaseModel):
    id: str
    name: str
    role: ParticipantRole
    is_host: bool = False
    joined_at: float
    completed: bool = False
    score: int | None = None
    accuracy: int | None = None
    average_response_time: int | None = None


class RoomState(BaseModel):
    code: str
    status: RoomStatus
    host_id: str
    participants: list[ParticipantState]
    participant_count: int
    created_at: float
    started_at: float | None = None
    quiz: dict[str, Any] | None = None
    settings: dict[str, Any] | None = None
    leaderboard: list[ParticipantState] = Field(default_factory=list)
    all_finished: bool = False
