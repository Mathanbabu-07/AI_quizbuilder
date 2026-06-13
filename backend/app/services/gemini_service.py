import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.quiz import Difficulty, GenerateQuizRequest, GeneratedQuiz
from app.services.ai_quiz_progress import complete_ai_quiz_progress, update_ai_quiz_progress
from app.services.quiz_validator import QuizValidationError, validate_quiz_payload
from app.utils.json_tools import extract_json_object

logger = logging.getLogger("genquiz.gemini")

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
_MAX_ATTEMPTS = 3
_CACHE_TTL_SECONDS = 10 * 60
_CACHE_MAX_ITEMS = 96
_client_lock = asyncio.Lock()
_client: httpx.AsyncClient | None = None
_response_cache: dict[str, tuple[float, GeneratedQuiz]] = {}


class GeminiPayloadError(ValueError):
    pass


@dataclass(frozen=True)
class GeminiQuizSettings:
    topic: str
    question_count: int
    difficulty: Difficulty
    time_per_question: int
    points_per_question: int
    progress_id: str | None = None

    @classmethod
    def from_request(cls, request: GenerateQuizRequest) -> "GeminiQuizSettings":
        return cls(
            topic=request.prompt.strip(),
            question_count=request.question_count,
            difficulty=request.difficulty,
            time_per_question=request.time_per_question,
            points_per_question=request.points_per_question,
            progress_id=request.progress_id,
        )


@dataclass
class GeminiService:
    settings: Settings

    async def generate_quiz(self, request: GenerateQuizRequest) -> GeneratedQuiz:
        quiz_settings = GeminiQuizSettings.from_request(request)
        api_key = self.settings.gemini_api_key
        if not api_key:
            logger.error("Gemini API key is missing for AI quiz generation.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to connect to AI service.",
            )

        model_name = self.settings.gemini_ai_model.strip() or "gemini-3.1-flash-lite"
        cache_key = _cache_key(model_name, quiz_settings)
        cached = _get_cached_quiz(cache_key)
        if cached:
            logger.info("Gemini quiz cache hit model=%s", model_name)
            complete_ai_quiz_progress(quiz_settings.progress_id)
            return cached

        last_error: Exception | None = None
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                if attempt == 1:
                    update_ai_quiz_progress(quiz_settings.progress_id, 25, "AI generation started")
                else:
                    update_ai_quiz_progress(quiz_settings.progress_id, 82, "Quiz validation failed. Regenerating...")

                payload = _build_gemini_payload(quiz_settings, attempt=attempt)
                response_payload = await self._post_generate_content(
                    model_name=model_name,
                    api_key=api_key,
                    payload=payload,
                    progress_id=quiz_settings.progress_id,
                    attempt=attempt,
                )
                update_ai_quiz_progress(quiz_settings.progress_id, 60, "Questions generated")

                parsed_payload = _extract_response_payload(response_payload)
                update_ai_quiz_progress(quiz_settings.progress_id, 80, "Quiz JSON formatted")

                quiz = validate_quiz_payload(
                    parsed_payload,
                    question_count=quiz_settings.question_count,
                    difficulty=quiz_settings.difficulty,
                    time_per_question=quiz_settings.time_per_question,
                    points_per_question=quiz_settings.points_per_question,
                    shuffle_options=True,
                )
                update_ai_quiz_progress(quiz_settings.progress_id, 90, "Validation completed")
                _set_cached_quiz(cache_key, quiz)
                complete_ai_quiz_progress(quiz_settings.progress_id)
                return quiz
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning("Gemini quiz generation timed out attempt=%s model=%s", attempt, model_name)
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code in {400, 401, 403, 404}:
                    logger.warning(
                        "Gemini request failed without retry status=%s model=%s detail=%s",
                        exc.response.status_code,
                        model_name,
                        _gemini_error_detail(exc.response),
                    )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Unable to connect to AI service.",
                    ) from exc
                logger.warning(
                    "Gemini request failed attempt=%s status=%s model=%s detail=%s",
                    attempt,
                    exc.response.status_code,
                    model_name,
                    _gemini_error_detail(exc.response),
                )
            except (GeminiPayloadError, QuizValidationError, ValueError, TypeError, KeyError) as exc:
                last_error = exc
                logger.warning("Gemini returned invalid quiz payload attempt=%s model=%s: %s", attempt, model_name, exc)

            if attempt < _MAX_ATTEMPTS:
                await asyncio.sleep(_retry_delay(attempt))

        if isinstance(last_error, httpx.TimeoutException):
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Generation is taking longer than expected. Please try again.",
            ) from last_error

        if isinstance(last_error, httpx.HTTPStatusError):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to connect to AI service.",
            ) from last_error

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quiz validation failed. Please try again.",
        ) from last_error

    async def _post_generate_content(
        self,
        *,
        model_name: str,
        api_key: str,
        payload: dict[str, Any],
        progress_id: str | None,
        attempt: int,
    ) -> dict[str, Any]:
        client = await _get_gemini_client()
        url = _generate_content_url(model_name)
        stop_event = asyncio.Event()
        progress_task = asyncio.create_task(_mark_gemini_wait_progress(progress_id, stop_event, attempt))
        try:
            response = await client.post(
                url,
                params={"key": api_key},
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=httpx.Timeout(48.0, connect=6.0),
            )
            response.raise_for_status()
            return response.json()
        finally:
            stop_event.set()
            progress_task.cancel()
            try:
                await progress_task
            except asyncio.CancelledError:
                pass


async def close_gemini_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
    _client = None


def _build_gemini_payload(settings: GeminiQuizSettings, *, attempt: int) -> dict[str, Any]:
    prompt = _build_minimal_prompt(settings, repair=attempt > 1)
    return {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _quiz_response_schema(settings.question_count),
            "candidateCount": 1,
            "maxOutputTokens": _max_output_tokens(settings.question_count, attempt),
            "temperature": 0.18 if attempt == 1 else 0.08,
            "topP": 0.82,
        },
    }


def _build_minimal_prompt(settings: GeminiQuizSettings, *, repair: bool) -> str:
    lines = [
        "Generate a multiple-choice quiz as JSON only.",
        f"Topic: {settings.topic}",
        f"Difficulty: {settings.difficulty}",
        f"Question count: {settings.question_count}",
        f"Time per question: {settings.time_per_question} seconds",
        "Rules: exactly 4 unique options per question; correctAnswer must exactly match one option; no null values; vary correct answer positions.",
        'Return shape: {"title":"","questions":[{"question":"","options":["","","",""],"correctAnswer":"","explanation":""}]}',
    ]
    if repair:
        lines.append("The previous response failed validation. Regenerate the full quiz, not a partial patch.")
    return "\n".join(lines)


def _quiz_response_schema(question_count: int) -> dict[str, Any]:
    return {
        "type": "OBJECT",
        "properties": {
            "title": {"type": "STRING"},
            "questions": {
                "type": "ARRAY",
                "minItems": question_count,
                "maxItems": question_count,
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "question": {"type": "STRING"},
                        "options": {
                            "type": "ARRAY",
                            "minItems": 4,
                            "maxItems": 4,
                            "items": {"type": "STRING"},
                        },
                        "correctAnswer": {"type": "STRING"},
                        "explanation": {"type": "STRING"},
                    },
                    "required": ["question", "options", "correctAnswer", "explanation"],
                    "propertyOrdering": ["question", "options", "correctAnswer", "explanation"],
                },
            },
        },
        "required": ["title", "questions"],
        "propertyOrdering": ["title", "questions"],
    }


def _extract_response_payload(data: dict[str, Any]) -> dict[str, Any]:
    _raise_for_gemini_error(data)
    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiPayloadError("Gemini response did not include candidates.")

    first_candidate = candidates[0]
    if not isinstance(first_candidate, dict):
        raise GeminiPayloadError("Gemini candidate was not an object.")

    finish_reason = str(first_candidate.get("finishReason") or "")
    if finish_reason in {"SAFETY", "RECITATION", "PROHIBITED_CONTENT", "SPII"}:
        raise GeminiPayloadError(f"Gemini blocked the response: {finish_reason}.")

    content = first_candidate.get("content")
    if not isinstance(content, dict):
        raise GeminiPayloadError("Gemini candidate did not include content.")

    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        raise GeminiPayloadError("Gemini content did not include text parts.")

    text_parts = [part.get("text") for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str)]
    raw_text = "\n".join(text_parts).strip()
    if not raw_text:
        raise GeminiPayloadError("Gemini returned empty quiz content.")

    return extract_json_object(raw_text)


def _raise_for_gemini_error(data: dict[str, Any]) -> None:
    error = data.get("error")
    if not error:
        return
    if isinstance(error, dict):
        message = error.get("message") or error.get("status") or error.get("code")
    else:
        message = str(error)
    raise GeminiPayloadError(f"Gemini provider error: {str(message)[:600]}")


async def _mark_gemini_wait_progress(progress_id: str | None, stop_event: asyncio.Event, attempt: int) -> None:
    if not progress_id:
        return

    markers = (
        [(2.0, 30, "Request sent to Gemini"), (8.0, 42, "Waiting for Gemini response"), (18.0, 54, "Gemini is creating questions")]
        if attempt == 1
        else [(2.0, 84, "Regeneration request sent to Gemini"), (8.0, 86, "Waiting for regenerated quiz")]
    )
    started_at = time.monotonic()

    for delay, progress, stage in markers:
        elapsed = time.monotonic() - started_at
        wait_for = max(0.0, delay - elapsed)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=wait_for)
            return
        except asyncio.TimeoutError:
            update_ai_quiz_progress(progress_id, progress, stage)


async def _get_gemini_client() -> httpx.AsyncClient:
    global _client
    if _client and not _client.is_closed:
        return _client

    async with _client_lock:
        if _client and not _client.is_closed:
            return _client

        _client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=32, max_keepalive_connections=12, keepalive_expiry=30.0),
            timeout=httpx.Timeout(48.0, connect=6.0),
            http2=False,
        )
        return _client


def _generate_content_url(model_name: str) -> str:
    normalized_model = model_name.strip()
    model_path = normalized_model if normalized_model.startswith("models/") else f"models/{normalized_model}"
    return f"{_GEMINI_BASE_URL}/{model_path}:generateContent"


def _max_output_tokens(question_count: int, attempt: int) -> int:
    return min(14_000, max(2_400, 850 + question_count * 340 + (attempt - 1) * 1_000))


def _retry_delay(attempt: int) -> float:
    return min(2.5, 0.45 * (2 ** (attempt - 1)))


def _gemini_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text[:600]
    error = payload.get("error") if isinstance(payload, dict) else None
    if isinstance(error, dict):
        return str(error.get("message") or error.get("status") or error.get("code") or "")[:600]
    return str(payload)[:600]


def _cache_key(model_name: str, settings: GeminiQuizSettings) -> str:
    digest = hashlib.sha256()
    parts = [
        model_name,
        settings.topic,
        settings.difficulty,
        str(settings.question_count),
        str(settings.time_per_question),
        str(settings.points_per_question),
    ]
    for part in parts:
        digest.update(part.encode("utf-8", errors="ignore"))
        digest.update(b"\0")
    return digest.hexdigest()


def _get_cached_quiz(cache_key: str) -> GeneratedQuiz | None:
    now = time.monotonic()
    cached = _response_cache.get(cache_key)
    if not cached:
        return None

    created_at, quiz = cached
    if now - created_at > _CACHE_TTL_SECONDS:
        _response_cache.pop(cache_key, None)
        return None
    return quiz.model_copy(deep=True)


def _set_cached_quiz(cache_key: str, quiz: GeneratedQuiz) -> None:
    now = time.monotonic()
    _response_cache[cache_key] = (now, quiz.model_copy(deep=True))
    if len(_response_cache) <= _CACHE_MAX_ITEMS:
        return

    expired_keys = [key for key, (created_at, _) in _response_cache.items() if now - created_at > _CACHE_TTL_SECONDS]
    for key in expired_keys:
        _response_cache.pop(key, None)

    while len(_response_cache) > _CACHE_MAX_ITEMS:
        oldest_key = min(_response_cache, key=lambda key: _response_cache[key][0])
        _response_cache.pop(oldest_key, None)
