import asyncio
import hashlib
import logging
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.quiz import Difficulty, GenerateFromUrlRequest, GeneratedQuiz
from app.services.quiz_validator import QuizValidationError, validate_quiz_payload
from app.utils.json_tools import extract_json_object
from app.utils.text_cleaner import clean_plain_text

logger = logging.getLogger("genquiz.gemini_url")

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
_MAX_ATTEMPTS = 3
_CACHE_TTL_SECONDS = 10 * 60
_CACHE_MAX_ITEMS = 64
_MAX_SOURCE_CHARACTERS = 36_000
_client_lock = asyncio.Lock()
_client: httpx.AsyncClient | None = None
_response_cache: dict[str, tuple[float, GeneratedQuiz]] = {}

_URL_JUNK_PATTERN = re.compile(
    r"\b("
    r"accept all cookies|cookie settings|enable javascript|sign up|log in|"
    r"subscribe|newsletter|advertisement|sponsored|share on|follow us|"
    r"privacy policy|terms of service|all rights reserved|related articles|"
    r"recommended for you|download the app|back to top"
    r")\b",
    re.IGNORECASE,
)


class GeminiUrlPayloadError(ValueError):
    pass


@dataclass(frozen=True)
class GeminiUrlGenerationSettings:
    question_count: int
    difficulty: Difficulty
    time_per_question: int
    points_per_question: int
    source_url: str
    source_title: str | None = None
    user_prompt: str | None = None

    @classmethod
    def from_request(
        cls,
        request: GenerateFromUrlRequest,
        *,
        source_url: str,
        source_title: str | None,
    ) -> "GeminiUrlGenerationSettings":
        return cls(
            question_count=request.question_count,
            difficulty=request.difficulty,
            time_per_question=request.time_per_question,
            points_per_question=request.points_per_question,
            source_url=source_url,
            source_title=source_title,
            user_prompt=request.user_prompt.strip() if request.user_prompt else None,
        )


@dataclass
class GeminiUrlService:
    settings: Settings

    async def generate_quiz(
        self,
        source_text: str,
        generation_settings: GeminiUrlGenerationSettings,
    ) -> GeneratedQuiz:
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to connect to URL quiz AI service.",
            )

        cleaned_content = clean_url_content(source_text)
        if len(cleaned_content) < 300:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Not enough clean learning content was found at this URL.",
            )

        model_name = self.settings.gemini_url_model.strip() or "gemini-2.5-flash"
        cache_key = _cache_key(model_name, cleaned_content, generation_settings)
        cached = _get_cached_quiz(cache_key)
        if cached:
            logger.info("Gemini URL quiz cache hit model=%s url=%s", model_name, generation_settings.source_url)
            return cached

        deadline = time.monotonic() + min(
            115.0,
            max(45.0, self.settings.source_generation_timeout_seconds),
        )
        last_error: Exception | None = None

        for attempt in range(1, _MAX_ATTEMPTS + 1):
            remaining = deadline - time.monotonic()
            if remaining <= 3.0:
                break

            try:
                payload = _build_request_payload(
                    cleaned_content,
                    generation_settings,
                    attempt=attempt,
                )
                response_payload = await self._post_generate_content(
                    model_name=model_name,
                    payload=payload,
                    timeout_seconds=min(42.0, max(6.0, remaining - 1.0)),
                )
                parsed_payload = _extract_response_payload(response_payload)
                quiz = validate_quiz_payload(
                    parsed_payload,
                    question_count=generation_settings.question_count,
                    difficulty=generation_settings.difficulty,
                    time_per_question=generation_settings.time_per_question,
                    points_per_question=generation_settings.points_per_question,
                    shuffle_options=True,
                )
                _set_cached_quiz(cache_key, quiz)
                logger.info(
                    "Gemini URL quiz generated model=%s url=%s questions=%s attempt=%s cleaned_chars=%s",
                    model_name,
                    generation_settings.source_url,
                    len(quiz.questions),
                    attempt,
                    len(cleaned_content),
                )
                return quiz
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning(
                    "Gemini URL generation timed out model=%s attempt=%s url=%s",
                    model_name,
                    attempt,
                    generation_settings.source_url,
                )
            except httpx.HTTPStatusError as exc:
                last_error = exc
                detail = _gemini_error_detail(exc.response)
                logger.warning(
                    "Gemini URL request failed model=%s attempt=%s status=%s detail=%s",
                    model_name,
                    attempt,
                    exc.response.status_code,
                    detail,
                )
                if exc.response.status_code in {400, 401, 403, 404}:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Unable to connect to URL quiz AI service.",
                    ) from exc
            except (GeminiUrlPayloadError, QuizValidationError, ValueError, TypeError, KeyError) as exc:
                last_error = exc
                logger.warning(
                    "Gemini URL quiz validation failed model=%s attempt=%s url=%s error=%s",
                    model_name,
                    attempt,
                    generation_settings.source_url,
                    exc,
                )

            if attempt < _MAX_ATTEMPTS:
                remaining = deadline - time.monotonic()
                delay = _retry_delay(attempt)
                if remaining > delay + 3.0:
                    await asyncio.sleep(delay)

        if isinstance(last_error, httpx.TimeoutException) or time.monotonic() >= deadline:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="URL quiz generation is taking longer than expected. Please try again.",
            ) from last_error

        if isinstance(last_error, httpx.HTTPStatusError):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to connect to URL quiz AI service.",
            ) from last_error

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL quiz validation failed after regeneration. Please try another page.",
        ) from last_error

    async def _post_generate_content(
        self,
        *,
        model_name: str,
        payload: dict[str, Any],
        timeout_seconds: float,
    ) -> dict[str, Any]:
        client = await _get_gemini_url_client()
        response = await client.post(
            _generate_content_url(model_name),
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.settings.gemini_api_key,
            },
            timeout=httpx.Timeout(timeout_seconds, connect=min(6.0, timeout_seconds)),
        )
        response.raise_for_status()
        return response.json()


async def close_gemini_url_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
    _client = None


def clean_url_content(source_text: str) -> str:
    initial = clean_plain_text(source_text, max_characters=_MAX_SOURCE_CHARACTERS * 2)
    selected_lines: list[str] = []
    seen: set[str] = set()
    total_characters = 0

    for raw_line in initial.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" \t-|")
        if len(line) < 20:
            continue
        if _URL_JUNK_PATTERN.search(line) and len(line) < 220:
            continue
        if line.count("|") >= 5 or line.count("›") >= 4:
            continue

        normalized = re.sub(r"[^a-z0-9]+", " ", line.casefold()).strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)

        next_size = len(line) + 1
        if total_characters + next_size > _MAX_SOURCE_CHARACTERS:
            break
        selected_lines.append(line)
        total_characters += next_size

    return "\n".join(selected_lines).strip()


def _build_request_payload(
    source_content: str,
    settings: GeminiUrlGenerationSettings,
    *,
    attempt: int,
) -> dict[str, Any]:
    source_title = settings.source_title or "Webpage"
    host_instruction = settings.user_prompt or "Focus on the most important educational concepts."
    retry_instruction = (
        "The previous response failed validation. Regenerate the complete quiz with the exact required count."
        if attempt > 1
        else ""
    )
    prompt = "\n".join(
        part
        for part in [
            f"Source title: {source_title}",
            f"Source URL: {settings.source_url}",
            f"Difficulty: {settings.difficulty}",
            f"Question count: {settings.question_count}",
            f"Time per question: {settings.time_per_question} seconds",
            f"Host instruction: {host_instruction}",
            "Create the quiz only from facts explicitly supported by SOURCE CONTENT.",
            "Use exactly four unique options per question. correctAnswer must exactly equal one option.",
            "Avoid duplicate or ambiguous questions. Add a concise factual explanation.",
            "Return JSON only and include no null values.",
            retry_instruction,
            "SOURCE CONTENT:",
            source_content,
        ]
        if part
    )

    return {
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "You generate accurate multiple-choice quizzes from supplied webpage text. "
                        "Never use outside knowledge when the source does not support a claim."
                    )
                }
            ]
        },
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _quiz_response_schema(settings.question_count),
            "candidateCount": 1,
            "maxOutputTokens": _max_output_tokens(settings.question_count, attempt),
            "temperature": 0.12 if attempt == 1 else 0.06,
            "topP": 0.82,
            "thinkingConfig": {"thinkingBudget": 512},
        },
    }


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
    error = data.get("error")
    if error:
        if isinstance(error, dict):
            message = error.get("message") or error.get("status") or error.get("code")
        else:
            message = str(error)
        raise GeminiUrlPayloadError(f"Gemini provider error: {str(message)[:600]}")

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiUrlPayloadError("Gemini response did not include candidates.")

    candidate = candidates[0]
    if not isinstance(candidate, dict):
        raise GeminiUrlPayloadError("Gemini candidate was invalid.")

    finish_reason = str(candidate.get("finishReason") or "")
    if finish_reason in {"SAFETY", "RECITATION", "PROHIBITED_CONTENT", "SPII"}:
        raise GeminiUrlPayloadError(f"Gemini blocked URL quiz generation: {finish_reason}.")

    content = candidate.get("content")
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list):
        raise GeminiUrlPayloadError("Gemini response did not contain quiz content.")

    text = "\n".join(
        str(part["text"])
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str) and not part.get("thought")
    ).strip()
    if not text:
        raise GeminiUrlPayloadError("Gemini returned empty URL quiz content.")
    return extract_json_object(text)


async def _get_gemini_url_client() -> httpx.AsyncClient:
    global _client
    if _client and not _client.is_closed:
        return _client

    async with _client_lock:
        if _client and not _client.is_closed:
            return _client
        _client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=24, max_keepalive_connections=10, keepalive_expiry=30.0),
            timeout=httpx.Timeout(42.0, connect=6.0),
            http2=False,
        )
        return _client


def _generate_content_url(model_name: str) -> str:
    normalized_model = model_name.strip()
    model_path = normalized_model if normalized_model.startswith("models/") else f"models/{normalized_model}"
    return f"{_GEMINI_BASE_URL}/{model_path}:generateContent"


def _max_output_tokens(question_count: int, attempt: int) -> int:
    return min(20_000, max(2_800, 1_000 + question_count * 340 + (attempt - 1) * 800))


def _retry_delay(attempt: int) -> float:
    return min(2.0, 0.5 * (2 ** (attempt - 1)))


def _gemini_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text[:600]
    error = payload.get("error") if isinstance(payload, dict) else None
    if isinstance(error, dict):
        return str(error.get("message") or error.get("status") or error.get("code") or "")[:600]
    return str(payload)[:600]


def _cache_key(
    model_name: str,
    source_content: str,
    settings: GeminiUrlGenerationSettings,
) -> str:
    digest = hashlib.sha256()
    parts = [
        model_name,
        source_content,
        settings.source_url,
        settings.source_title or "",
        settings.user_prompt or "",
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
