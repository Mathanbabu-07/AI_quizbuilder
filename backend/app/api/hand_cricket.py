from fastapi import APIRouter, Query, status

from app.models.hand_cricket import (
    HandCricketMatchCreate,
    HandCricketMatchListResponse,
    HandCricketMatchResponse,
)
from app.services.hand_cricket_service import hand_cricket_service

router = APIRouter(prefix="/api/hand-cricket", tags=["hand cricket"])


@router.post("/matches", response_model=HandCricketMatchResponse, status_code=status.HTTP_201_CREATED)
async def create_hand_cricket_match(request: HandCricketMatchCreate) -> HandCricketMatchResponse:
    match = await hand_cricket_service.save_match(request)
    return HandCricketMatchResponse(**match)


@router.get("/matches", response_model=HandCricketMatchListResponse)
async def list_hand_cricket_matches(limit: int = Query(default=20, ge=1, le=100)) -> HandCricketMatchListResponse:
    matches = await hand_cricket_service.list_matches(limit)
    return HandCricketMatchListResponse(matches=[HandCricketMatchResponse(**match) for match in matches])
