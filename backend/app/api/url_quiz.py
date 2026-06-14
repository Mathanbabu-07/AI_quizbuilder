import logging
import time
from dataclasses import dataclass
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.models.quiz import (
    GenerateFromUrlRequest,
    GenerateFromUrlResponse,
    UrlExtractRequest,
    UrlExtractResponse,
    VerifyQuizRequest,
    VerifyQuizResponse,
)
from app.services.gemini_url_service import GeminiUrlGenerationSettings, GeminiUrlService
from app.services.multiplayer_service import create_persistent_room_async
from app.services.quiz_formatter import quiz_to_storage_dict
from app.services.quiz_validator import validate_quiz_payload
from app.services.supabase_service import supabase_service
from app.services.url_extractor import URLExtractor

router = APIRouter(prefix="/api/url-quiz", tags=["url-quiz"])
logger = logging.getLogger("genquiz.url_quiz")


@dataclass
class CachedUrlExtraction:
    url: str
    title: str | None
    text: str
    created_at: float


_url_cache: dict[str, CachedUrlExtraction] = {}
_CACHE_TTL_SECONDS = 30 * 60


@router.post("/extract", response_model=UrlExtractResponse)
async def extract_url_content(
    request: UrlExtractRequest,
    settings: Settings = Depends(get_settings),
) -> UrlExtractResponse:
    _prune_cache()
    extraction = await URLExtractor(settings).extract(request.url)
    extraction_id = uuid4().hex
    _url_cache[extraction_id] = CachedUrlExtraction(
        url=extraction.url,
        title=extraction.title,
        text=extraction.text,
        created_at=time.time(),
    )

    return UrlExtractResponse(
        extraction_id=extraction_id,
        url=extraction.url,
        title=extraction.title,
        extracted_characters=len(extraction.text),
        preview=extraction.text[:420],
    )


@router.post("/generate", response_model=GenerateFromUrlResponse)
async def generate_quiz_from_url(
    request: GenerateFromUrlRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateFromUrlResponse:
    _prune_cache()
    cached = await _get_or_extract(request, settings)
    generation_settings = GeminiUrlGenerationSettings.from_request(
        request,
        source_url=cached.url,
        source_title=cached.title,
    )
    quiz = await GeminiUrlService(settings).generate_quiz(
        cached.text,
        generation_settings,
    )
    model_used = settings.gemini_url_model
    quiz_id = await supabase_service.save_generated_quiz_async(
        title=quiz.title,
        quiz_data=quiz_to_storage_dict(quiz),
        mode=request.mode,
        host_id=request.host_id,
        source_type="url",
        source_url=cached.url,
    )

    room_code: str | None = None
    room_id: str | None = None
    if request.mode == "multiplayer":
        room_code, room_id = await create_persistent_room_async(quiz_id=quiz_id, host_name=request.host_name)

    return GenerateFromUrlResponse(
        quiz=quiz,
        meta={
            "model": model_used,
            "primary_model": model_used,
            "fallback_model": None,
            "fallback_reason": None,
            "provider": "gemini",
            "source_type": "url",
            "source_url": cached.url,
            "source_title": cached.title,
            "question_count": len(quiz.questions),
            "quiz_id": quiz_id,
            "room_code": room_code,
            "room_id": room_id,
        },
    )


@router.post("/verify", response_model=VerifyQuizResponse)
async def verify_url_quiz(request: VerifyQuizRequest) -> VerifyQuizResponse:
    if not request.quiz.questions:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot verify an empty quiz.")

    quiz = validate_quiz_payload(
        request.quiz.model_dump(by_alias=True),
        question_count=len(request.quiz.questions),
        difficulty=request.quiz.questions[0].difficulty if request.quiz.questions else "Medium",
        time_per_question=request.quiz.questions[0].time_limit if request.quiz.questions else 30,
        points_per_question=request.quiz.questions[0].points if request.quiz.questions else 1,
    )
    quiz_id = await supabase_service.save_generated_quiz_async(
        title=quiz.title,
        quiz_data=quiz_to_storage_dict(quiz),
        mode=request.mode,
        host_id=request.host_id,
        source_type="url",
    )
    room_code: str | None = None
    if request.mode == "multiplayer":
        room_code, _ = await create_persistent_room_async(quiz_id=quiz_id, host_name=request.host_name)

    return VerifyQuizResponse(quiz=quiz, quiz_id=quiz_id, room_code=room_code)


async def _get_or_extract(request: GenerateFromUrlRequest, settings: Settings) -> CachedUrlExtraction:
    if request.extraction_id:
        cached = _url_cache.get(request.extraction_id)
        if cached:
            return cached
        if not request.url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="URL extraction session expired. Paste the URL and extract again.",
            )

    extraction = await URLExtractor(settings).extract(request.url or "")
    cached = CachedUrlExtraction(
        url=extraction.url,
        title=extraction.title,
        text=extraction.text,
        created_at=time.time(),
    )
    _url_cache[uuid4().hex] = cached
    return cached


def _prune_cache() -> None:
    expires_before = time.time() - _CACHE_TTL_SECONDS
    expired_keys = [key for key, value in _url_cache.items() if value.created_at < expires_before]
    for key in expired_keys:
        _url_cache.pop(key, None)
