from fastapi import APIRouter, Query, status

from app.models.memory_grid import (
    MemoryGridCompleteRequest,
    MemoryGridCompleteResponse,
    MemoryGridLeaderboardEntry,
    MemoryGridLeaderboardResponse,
    MemoryGridLifelineUpdateRequest,
    MemoryGridLifelineUpdateResponse,
    MemoryGridRetryRequest,
    MemoryGridRoundProgressRequest,
    MemoryGridRoundProgressResponse,
    MemoryGridSessionResponse,
    MemoryGridStartRequest,
)
from app.services.memory_grid_service import memory_grid_service

router = APIRouter(prefix="/api/memory-grid", tags=["memory grid"])


@router.post("/start", response_model=MemoryGridSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_memory_grid_game(request: MemoryGridStartRequest) -> MemoryGridSessionResponse:
    session = await memory_grid_service.start_game(request)
    return MemoryGridSessionResponse(**session)


@router.post("/rounds", response_model=MemoryGridRoundProgressResponse)
async def save_memory_grid_round(request: MemoryGridRoundProgressRequest) -> MemoryGridRoundProgressResponse:
    progress = await memory_grid_service.save_round_progress(request)
    return MemoryGridRoundProgressResponse(**progress)


@router.post("/lifelines", response_model=MemoryGridLifelineUpdateResponse)
async def update_memory_grid_lifelines(request: MemoryGridLifelineUpdateRequest) -> MemoryGridLifelineUpdateResponse:
    progress = await memory_grid_service.update_lifelines(request)
    return MemoryGridLifelineUpdateResponse(**progress)


@router.post("/complete", response_model=MemoryGridCompleteResponse)
async def complete_memory_grid_game(request: MemoryGridCompleteRequest) -> MemoryGridCompleteResponse:
    completed = await memory_grid_service.complete_game(request)
    return MemoryGridCompleteResponse(**completed)


@router.get("/leaderboard", response_model=MemoryGridLeaderboardResponse)
async def list_memory_grid_leaderboard(limit: int = Query(default=25, ge=1, le=100)) -> MemoryGridLeaderboardResponse:
    entries = await memory_grid_service.list_leaderboard(limit)
    return MemoryGridLeaderboardResponse(entries=[MemoryGridLeaderboardEntry(**entry) for entry in entries])


@router.post("/retry", response_model=MemoryGridSessionResponse, status_code=status.HTTP_201_CREATED)
async def retry_memory_grid_session(request: MemoryGridRetryRequest) -> MemoryGridSessionResponse:
    session = await memory_grid_service.retry_session(request)
    return MemoryGridSessionResponse(**session)
