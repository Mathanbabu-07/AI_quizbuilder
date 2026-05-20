from typing import Literal

from pydantic import BaseModel, Field, field_validator


EmojiRushMedal = Literal["gold", "silver", "bronze", "none"]
EmojiRushStatus = Literal["active", "completed", "abandoned"]


class EmojiRushStartRequest(BaseModel):
    player_id: str = Field(..., min_length=1, max_length=120)
    player_name: str = Field(default="Player", min_length=1, max_length=80)

    @field_validator("player_id", "player_name")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        return normalized or "Player"


class EmojiRushSessionResponse(BaseModel):
    session_id: str
    player_id: str
    player_name: str
    status: EmojiRushStatus
    current_round: int
    completed_rounds: int
    total_score: int
    medal: EmojiRushMedal | None = None
    created_at: str | None = None
    updated_at: str | None = None


class EmojiRushRoundProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=80)
    player_id: str = Field(..., min_length=1, max_length=120)
    round_number: int = Field(..., ge=1, le=5)
    points: int = Field(..., ge=0, le=250)
    match3_count: int = Field(..., ge=0, le=100)
    match5_count: int = Field(..., ge=0, le=80)
    max_combo: int = Field(..., ge=0, le=40)
    moves: int = Field(..., ge=0, le=120)
    duration_ms: int = Field(..., ge=0, le=600_000)
    completed: bool
    board_size: int = Field(..., ge=5, le=11)
    emoji_variety: int = Field(..., ge=4, le=10)


class EmojiRushRoundProgressResponse(BaseModel):
    session: EmojiRushSessionResponse
    round_number: int
    points: int
    completed: bool
    accepted: bool = True


class EmojiRushCompleteRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=80)
    player_id: str = Field(..., min_length=1, max_length=120)
    reported_total_score: int = Field(default=0, ge=0, le=1250)


class EmojiRushCompleteResponse(BaseModel):
    session: EmojiRushSessionResponse
    medal: EmojiRushMedal
    leaderboard_saved: bool


class EmojiRushLeaderboardEntry(BaseModel):
    session_id: str
    player_id: str
    player_name: str
    total_score: int
    completed_rounds: int
    medal: EmojiRushMedal
    best_combo: int
    created_at: str | None = None


class EmojiRushLeaderboardResponse(BaseModel):
    entries: list[EmojiRushLeaderboardEntry]
