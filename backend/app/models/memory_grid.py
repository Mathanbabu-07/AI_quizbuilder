from typing import Literal

from pydantic import BaseModel, Field, field_validator


MemoryGridMedal = Literal["gold", "silver", "bronze", "none"]
MemoryGridStatus = Literal["active", "completed", "abandoned"]
MemoryGridResult = Literal["active", "victory", "game_over", "abandoned"]
MemoryGridLifelineReason = Literal["wrong_selection", "timeout"]


class MemoryGridStartRequest(BaseModel):
    player_id: str = Field(..., min_length=1, max_length=120)
    player_name: str = Field(default="Player", min_length=1, max_length=80)

    @field_validator("player_id", "player_name")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        return normalized or "Player"


class MemoryGridSessionResponse(BaseModel):
    session_id: str
    player_id: str
    player_name: str
    status: MemoryGridStatus
    current_round: int
    completed_rounds: int
    total_score: int
    hearts_remaining: int
    total_accuracy: float
    completion_time_ms: int
    result: MemoryGridResult
    medal: MemoryGridMedal | None = None
    created_at: str | None = None
    updated_at: str | None = None


class MemoryGridRoundProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=80)
    player_id: str = Field(..., min_length=1, max_length=120)
    round_number: int = Field(..., ge=1, le=5)
    score: int = Field(..., ge=0, le=2400)
    correct_targets: int = Field(..., ge=0, le=6)
    wrong_attempts: int = Field(..., ge=0, le=30)
    total_selections: int = Field(..., ge=0, le=50)
    remaining_hearts: int = Field(..., ge=0, le=4)
    duration_ms: int = Field(..., ge=0, le=600_000)
    completed: bool
    grid_rows: int = Field(..., ge=2, le=6)
    grid_cols: int = Field(..., ge=2, le=6)
    memorize_seconds: int = Field(..., ge=5, le=10)
    target_count: int = Field(..., ge=3, le=6)


class MemoryGridRoundProgressResponse(BaseModel):
    session: MemoryGridSessionResponse
    round_number: int
    score: int
    completed: bool
    accepted: bool = True


class MemoryGridLifelineUpdateRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=80)
    player_id: str = Field(..., min_length=1, max_length=120)
    round_number: int = Field(..., ge=1, le=5)
    remaining_hearts: int = Field(..., ge=0, le=4)
    wrong_attempts: int = Field(..., ge=0, le=30)
    reason: MemoryGridLifelineReason


class MemoryGridLifelineUpdateResponse(BaseModel):
    session: MemoryGridSessionResponse
    accepted: bool = True


class MemoryGridCompleteRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=80)
    player_id: str = Field(..., min_length=1, max_length=120)
    reported_total_score: int = Field(default=0, ge=0, le=8500)
    result: MemoryGridResult
    remaining_hearts: int = Field(..., ge=0, le=4)
    total_accuracy: float = Field(default=0, ge=0, le=100)
    completion_time_ms: int = Field(default=0, ge=0, le=1_200_000)


class MemoryGridCompleteResponse(BaseModel):
    session: MemoryGridSessionResponse
    medal: MemoryGridMedal
    leaderboard_saved: bool


class MemoryGridRetryRequest(BaseModel):
    player_id: str = Field(..., min_length=1, max_length=120)
    player_name: str = Field(default="Player", min_length=1, max_length=80)
    previous_session_id: str | None = Field(default=None, max_length=80)

    @field_validator("player_id", "player_name")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        return normalized or "Player"


class MemoryGridLeaderboardEntry(BaseModel):
    session_id: str
    player_id: str
    player_name: str
    total_score: int
    completed_rounds: int
    hearts_remaining: int
    total_accuracy: float
    completion_time_ms: int
    medal: MemoryGridMedal
    created_at: str | None = None


class MemoryGridLeaderboardResponse(BaseModel):
    entries: list[MemoryGridLeaderboardEntry]
