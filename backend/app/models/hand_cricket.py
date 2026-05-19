from typing import Literal

from pydantic import BaseModel, Field


HandCricketWinner = Literal["player", "ai", "draw"]


class HandCricketMatchCreate(BaseModel):
    player_name: str = Field(default="Player", min_length=1, max_length=80)
    player_score: int = Field(..., ge=0, le=36)
    ai_score: int = Field(..., ge=0, le=36)
    winner: HandCricketWinner


class HandCricketMatchResponse(HandCricketMatchCreate):
    id: str
    created_at: str | None = None


class HandCricketMatchListResponse(BaseModel):
    matches: list[HandCricketMatchResponse]
