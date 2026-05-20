from fastapi import APIRouter, Query, status

from app.models.emoji_rush import (
    EmojiRushCompleteRequest,
    EmojiRushCompleteResponse,
    EmojiRushLeaderboardEntry,
    EmojiRushLeaderboardResponse,
    EmojiRushRoundProgressRequest,
    EmojiRushRoundProgressResponse,
    EmojiRushSessionResponse,
    EmojiRushStartRequest,
)
from app.services.emoji_rush_service import emoji_rush_service

router = APIRouter(prefix="/api/emoji-rush", tags=["emoji rush"])


@router.post("/start", response_model=EmojiRushSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_emoji_rush_game(request: EmojiRushStartRequest) -> EmojiRushSessionResponse:
    session = await emoji_rush_service.start_game(request)
    return EmojiRushSessionResponse(**session)


@router.post("/rounds", response_model=EmojiRushRoundProgressResponse)
async def save_emoji_rush_round(request: EmojiRushRoundProgressRequest) -> EmojiRushRoundProgressResponse:
    progress = await emoji_rush_service.save_round_progress(request)
    return EmojiRushRoundProgressResponse(**progress)


@router.post("/complete", response_model=EmojiRushCompleteResponse)
async def complete_emoji_rush_game(request: EmojiRushCompleteRequest) -> EmojiRushCompleteResponse:
    completed = await emoji_rush_service.complete_game(request)
    return EmojiRushCompleteResponse(**completed)


@router.get("/leaderboard", response_model=EmojiRushLeaderboardResponse)
async def list_emoji_rush_leaderboard(limit: int = Query(default=25, ge=1, le=100)) -> EmojiRushLeaderboardResponse:
    entries = await emoji_rush_service.list_leaderboard(limit)
    return EmojiRushLeaderboardResponse(entries=[EmojiRushLeaderboardEntry(**entry) for entry in entries])
