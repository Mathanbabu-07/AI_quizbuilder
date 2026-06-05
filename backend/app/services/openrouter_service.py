import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass, replace
from typing import Any, Literal

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.quiz import Difficulty, GenerateFromFileRequest, GenerateQuizRequest, GeneratedQuiz
from app.services.quiz_validator import QuizValidationError, normalize_quiz_payload, validate_quiz_payload
from app.utils.json_tools import extract_json_object

logger = logging.getLogger("genquiz.openrouter")

GenerationSource = Literal["prompt", "pdf", "url", "file"]
_CACHE_TTL_SECONDS = 10 * 60
_CACHE_MAX_ITEMS = 96
_client_lock = asyncio.Lock()
_client: httpx.AsyncClient | None = None
_response_cache: dict[str, tuple[float, GeneratedQuiz]] = {}


@dataclass(frozen=True)
class QuizGenerationSettings:
    app_settings: Settings
    question_count: int
    difficulty: Difficulty
    time_per_question: int
    points_per_question: int
    source_type: GenerationSource = "prompt"
    user_prompt: str | None = None
    total_quiz_time: int | None = None
    source_url: str | None = None
    source_title: str | None = None

    @classmethod
    def from_prompt(cls, app_settings: Settings, request: GenerateQuizRequest) -> "QuizGenerationSettings":
        return cls(
            app_settings=app_settings,
            question_count=request.question_count,
            difficulty=request.difficulty,
            time_per_question=request.time_per_question,
            points_per_question=request.points_per_question,
            total_quiz_time=request.total_quiz_time,
            source_type="prompt",
        )

    @classmethod
    def from_file_request(
        cls,
        app_settings: Settings,
        request: GenerateFromFileRequest,
        *,
        source_type: GenerationSource,
        source_url: str | None = None,
        source_title: str | None = None,
    ) -> "QuizGenerationSettings":
        return cls(
            app_settings=app_settings,
            question_count=request.question_count,
            difficulty=request.difficulty,
            time_per_question=request.time_per_question,
            points_per_question=request.points_per_question,
            source_type=source_type,
            user_prompt=request.user_prompt,
            source_url=source_url,
            source_title=source_title,
        )


async def generate_quiz_with_model(
    model_name: str,
    content: str,
    settings: QuizGenerationSettings,
) -> GeneratedQuiz:
    return await OpenRouterService(settings.app_settings).generate_quiz_with_model(
        model_name=model_name,
        content=content,
        generation_settings=settings,
    )


async def close_openrouter_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
    _client = None


@dataclass
class OpenRouterService:
    settings: Settings

    async def generate_quiz(self, request: GenerateQuizRequest) -> GeneratedQuiz:
        return await self.generate_quiz_with_model(
            model_name=self.settings.openrouter_model,
            content=request.prompt,
            generation_settings=QuizGenerationSettings.from_prompt(self.settings, request),
        )

    async def generate_quiz_with_model(
        self,
        *,
        model_name: str,
        content: str,
        generation_settings: QuizGenerationSettings,
    ) -> GeneratedQuiz:
        if not self.settings.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenRouter API key is missing. Add OPENROUTER_API_KEY in backend/.env and restart the backend.",
            )

        compact_content = _compact_generation_content(content, generation_settings.source_type)
        cache_key = _cache_key(model_name, compact_content, generation_settings)
        cached = _get_cached_quiz(cache_key)
        if cached:
            logger.info("OpenRouter quiz cache hit model=%s source=%s", model_name, generation_settings.source_type)
            return cached

        payload: dict[str, Any] = {
            "model": model_name,
            "messages": _build_generation_messages(compact_content, generation_settings),
            "temperature": _initial_temperature(generation_settings.source_type),
            "top_p": 0.82,
            "max_tokens": _max_tokens(generation_settings.question_count),
            "response_format": {"type": "json_object"},
        }

        headers = self._headers()
        url = f"{self.settings.openrouter_base_url}/chat/completions"
        deadline = time.monotonic() + min(150.0, max(30.0, self.settings.generation_timeout_seconds))
        last_error: Exception | None = None

        for attempt in range(3):
            remaining = deadline - time.monotonic()
            if remaining <= 1.0:
                break

            try:
                payload["temperature"] = _retry_temperature(generation_settings.source_type, attempt)
                timeout = httpx.Timeout(max(5.0, remaining - 0.5), connect=min(6.0, max(2.0, remaining / 4)))
                client = await _get_openrouter_client()
                response = await client.post(url, json=payload, headers=headers, timeout=timeout)
                response.raise_for_status()
                parsed_payload = self._extract_response_payload(response.json())
                try:
                    quiz = self._validate_parsed_payload(parsed_payload, generation_settings)
                except QuizValidationError as exc:
                    completed_quiz = await self._try_complete_short_prompt_quiz(
                        model_name=model_name,
                        original_content=compact_content,
                        parsed_payload=parsed_payload,
                        generation_settings=generation_settings,
                        headers=headers,
                        url=url,
                        deadline=deadline,
                    )
                    if completed_quiz:
                        logger.info(
                            "OpenRouter short AI quiz repaired model=%s expected=%s",
                            model_name,
                            generation_settings.question_count,
                        )
                        _set_cached_quiz(cache_key, completed_quiz)
                        return completed_quiz
                    raise exc
                _set_cached_quiz(cache_key, quiz)
                return quiz
            except httpx.TimeoutException as exc:
                last_error = exc
            except httpx.HTTPStatusError as exc:
                detail = self._openrouter_error_message(exc.response)
                if (
                    exc.response.status_code == status.HTTP_400_BAD_REQUEST
                    and "response_format" in detail.casefold()
                    and "response_format" in payload
                ):
                    logger.info("OpenRouter model rejected response_format; retrying without strict JSON mode.")
                    payload.pop("response_format", None)
                    last_error = exc
                    continue
                if exc.response.status_code in {400, 401, 402, 403, 404}:
                    raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
                if exc.response.status_code in {408, 429, 500, 502, 503, 504} and attempt == 2:
                    raise HTTPException(
                        status_code=exc.response.status_code,
                        detail=_provider_retry_exhausted_message(
                            exc.response.status_code,
                            generation_settings.source_type,
                            model_name,
                            detail,
                        ),
                    ) from exc
                last_error = exc
            except (KeyError, TypeError, ValueError, QuizValidationError) as exc:
                logger.warning(
                    "OpenRouter returned unusable quiz JSON on attempt %s model=%s source=%s: %s",
                    attempt + 1,
                    model_name,
                    generation_settings.source_type,
                    exc,
                )
                payload["messages"] = _build_generation_messages(
                    compact_content,
                    generation_settings,
                    repair=True,
                )
                last_error = exc

            remaining = deadline - time.monotonic()
            if attempt < 2 and remaining > 2.0:
                await asyncio.sleep(min(0.8, 0.3 + attempt * 0.2))

        if isinstance(last_error, httpx.TimeoutException) or (deadline - time.monotonic()) <= 1.0:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"{_source_label(generation_settings.source_type)} quiz generation took too long. Try fewer questions or a smaller source.",
            ) from last_error

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI returned an invalid quiz format. Try fewer questions or a cleaner {_source_label(generation_settings.source_type).lower()}.",
        ) from last_error

    async def _try_complete_short_prompt_quiz(
        self,
        *,
        model_name: str,
        original_content: str,
        parsed_payload: dict[str, Any],
        generation_settings: QuizGenerationSettings,
        headers: dict[str, str],
        url: str,
        deadline: float,
    ) -> GeneratedQuiz | None:
        if generation_settings.source_type != "prompt":
            return None

        partial_payload = normalize_quiz_payload(
            parsed_payload,
            question_count=generation_settings.question_count,
            difficulty=generation_settings.difficulty,
            time_per_question=generation_settings.time_per_question,
            points_per_question=generation_settings.points_per_question,
            shuffle_options=True,
        )
        partial_questions = partial_payload.get("questions") or []
        if not isinstance(partial_questions, list):
            return None

        missing_count = generation_settings.question_count - len(partial_questions)
        if missing_count <= 0 or not partial_questions:
            return None

        remaining = deadline - time.monotonic()
        if remaining <= 8.0:
            return None

        existing_question_text = "\n".join(
            f"- {question.get('question', '')}" for question in partial_questions if isinstance(question, dict)
        )
        missing_label = "questions" if missing_count != 1 else "question"
        repair_content = f"""
Original quiz topic:
{original_content}

Existing accepted questions. Do not repeat or rephrase these:
{existing_question_text}

Generate exactly {missing_count} additional unique multiple-choice {missing_label} to complete the quiz.
""".strip()
        repair_settings = replace(
            generation_settings,
            question_count=missing_count,
            user_prompt=(
                "Return only the missing question JSON. Do not include existing questions. "
                "Use the same difficulty, timeLimit, points, and answer quality."
            ),
        )
        payload: dict[str, Any] = {
            "model": model_name,
            "messages": _build_generation_messages(repair_content, repair_settings, repair=True),
            "temperature": 0.08,
            "top_p": 0.78,
            "max_tokens": _max_tokens(missing_count),
            "response_format": {"type": "json_object"},
        }
        last_error: Exception | None = None

        for attempt in range(2):
            remaining = deadline - time.monotonic()
            if remaining <= 4.0:
                break

            try:
                timeout = httpx.Timeout(max(4.0, remaining - 0.5), connect=min(5.0, max(2.0, remaining / 4)))
                client = await _get_openrouter_client()
                response = await client.post(url, json=payload, headers=headers, timeout=timeout)
                response.raise_for_status()
                missing_payload = self._extract_response_payload(response.json())
                normalized_missing = normalize_quiz_payload(
                    missing_payload,
                    question_count=missing_count,
                    difficulty=generation_settings.difficulty,
                    time_per_question=generation_settings.time_per_question,
                    points_per_question=generation_settings.points_per_question,
                    shuffle_options=True,
                )
                merged_payload = {
                    "title": partial_payload.get("title") or "GENQUIZ Quiz",
                    "questions": [
                        *partial_questions,
                        *(normalized_missing.get("questions") or []),
                    ],
                }
                return validate_quiz_payload(
                    merged_payload,
                    question_count=generation_settings.question_count,
                    difficulty=generation_settings.difficulty,
                    time_per_question=generation_settings.time_per_question,
                    points_per_question=generation_settings.points_per_question,
                    shuffle_options=False,
                )
            except (httpx.HTTPError, KeyError, TypeError, ValueError, QuizValidationError) as exc:
                last_error = exc
                logger.warning(
                    "OpenRouter short AI quiz repair failed attempt=%s model=%s missing=%s: %s",
                    attempt + 1,
                    model_name,
                    missing_count,
                    exc,
                )
                payload["messages"] = _build_generation_messages(repair_content, repair_settings, repair=True)

            if attempt == 0 and deadline - time.monotonic() > 5.0:
                await asyncio.sleep(0.2)

        if last_error:
            logger.warning("OpenRouter short AI quiz repair exhausted model=%s: %s", model_name, last_error)
        return None

    def _parse_response(self, data: dict[str, Any], settings: QuizGenerationSettings) -> GeneratedQuiz:
        parsed = self._extract_response_payload(data)
        return self._validate_parsed_payload(parsed, settings)

    def _extract_response_payload(self, data: dict[str, Any]) -> dict[str, Any]:
        message = data["choices"][0]["message"]
        content = _coerce_message_content(message.get("content"))
        return extract_json_object(content)

    def _validate_parsed_payload(self, parsed: dict[str, Any], settings: QuizGenerationSettings) -> GeneratedQuiz:
        return validate_quiz_payload(
            parsed,
            question_count=settings.question_count,
            difficulty=settings.difficulty,
            time_per_question=settings.time_per_question,
            points_per_question=settings.points_per_question,
            shuffle_options=True,
        )

    def _headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "X-Title": "GENQUIZ",
        }
        if self.settings.frontend_url:
            headers["HTTP-Referer"] = self.settings.frontend_url
        return headers

    @staticmethod
    def _openrouter_error_message(response: httpx.Response) -> str:
        try:
            payload = response.json()
            message = payload.get("error", {}).get("message") or payload.get("message")
            if message:
                return f"OpenRouter error: {message}"
        except ValueError:
            pass
        return f"OpenRouter request failed with status {response.status_code}."


def _build_generation_messages(
    content: str,
    settings: QuizGenerationSettings,
    *,
    repair: bool = False,
) -> list[dict[str, str]]:
    system = (
        "You are GENQUIZ, an expert multiple-choice quiz generator. "
        "Return exactly one valid JSON object. Do not use markdown, code fences, comments, trailing commas, or extra prose. "
        "Every string must be valid JSON."
    )
    if settings.source_type in {"pdf", "url", "file"}:
        system += " Use only facts supported by the provided source content."

    source_instruction = _source_instruction(settings)
    host_instruction = (settings.user_prompt or "").strip() or "Use the most important concepts."
    repair_instruction = (
        "\nRepair mode: the previous output was invalid. Return only the required JSON shape with exactly "
        f"{settings.question_count} questions, four options per question, and correctAnswer equal to one option."
        if repair
        else ""
    )

    user = f"""
{source_instruction}

Host instructions:
{host_instruction}

Rules:
- Generate exactly {settings.question_count} questions.
- The questions array must contain exactly {settings.question_count} objects, never fewer.
- Difficulty must be {settings.difficulty}.
- Each question must have exactly 4 unique options.
- correctAnswer must exactly match one option.
- explanation must be a short one-sentence reason for the answer.
- timeLimit must be {settings.time_per_question}.
- points must be {settings.points_per_question}.
- Avoid duplicate questions and repeated answer patterns.
- Keep questions concise, clear, and multiplayer-ready.
- Do not include unsupported facts.
- Return JSON only.
{repair_instruction}

Required JSON shape:
{{
  "title": "Short quiz title",
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "One sentence explanation",
      "timeLimit": {settings.time_per_question},
      "points": {settings.points_per_question}
    }}
  ]
}}

Content:
{content}
""".strip()

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _source_instruction(settings: QuizGenerationSettings) -> str:
    if settings.source_type == "prompt":
        return "Create a quiz from the user prompt below."
    if settings.source_type == "pdf":
        return "Create a quiz from the extracted PDF text below."
    if settings.source_type == "url":
        location = f" URL: {settings.source_url}." if settings.source_url else ""
        title = f" Page title: {settings.source_title}." if settings.source_title else ""
        return f"Create a quiz from the extracted webpage content below.{location}{title}"
    return "Create a quiz from the extracted file text below."


def _compact_generation_content(content: str, source_type: GenerationSource) -> str:
    max_characters = 18_000 if source_type == "prompt" else 28_000 if source_type == "url" else 22_000
    paragraphs = [part.strip() for part in content.splitlines() if part.strip()]
    if not paragraphs:
        return content.strip()[:max_characters]

    chunks: list[str] = []
    total = 0
    for paragraph in paragraphs:
        next_len = len(paragraph) + 1
        if total + next_len > max_characters:
            break
        chunks.append(paragraph)
        total += next_len
    return "\n".join(chunks).strip()


def _coerce_message_content(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if text:
                    parts.append(str(text))
        return "\n".join(parts)
    raise ValueError("OpenRouter response message content was empty.")


def _initial_temperature(source_type: GenerationSource) -> float:
    if source_type == "prompt":
        return 0.26
    if source_type == "url":
        return 0.18
    return 0.16


def _retry_temperature(source_type: GenerationSource, attempt: int) -> float:
    if attempt <= 0:
        return _initial_temperature(source_type)
    return 0.08 if source_type in {"pdf", "url", "file"} else 0.12


def _max_tokens(question_count: int) -> int:
    return min(9000, max(1800, 760 + question_count * 230))


async def _get_openrouter_client() -> httpx.AsyncClient:
    global _client
    if _client and not _client.is_closed:
        return _client

    async with _client_lock:
        if _client and not _client.is_closed:
            return _client

        _client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=32, max_keepalive_connections=12, keepalive_expiry=30.0),
            timeout=httpx.Timeout(120.0, connect=6.0),
            http2=False,
        )
        return _client


def _cache_key(model_name: str, content: str, settings: QuizGenerationSettings) -> str:
    digest = hashlib.sha256()
    parts = [
        model_name,
        settings.source_type,
        str(settings.question_count),
        settings.difficulty,
        str(settings.time_per_question),
        str(settings.points_per_question),
        str(settings.total_quiz_time or ""),
        settings.user_prompt or "",
        settings.source_url or "",
        settings.source_title or "",
        content,
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


def _source_label(source_type: GenerationSource) -> str:
    if source_type == "prompt":
        return "AI"
    if source_type == "pdf":
        return "PDF"
    if source_type == "url":
        return "URL"
    return "File"


def _provider_retry_exhausted_message(
    status_code: int,
    source_type: GenerationSource,
    model_name: str,
    provider_detail: str,
) -> str:
    if status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
        return (
            f"{_source_label(source_type)} quiz model is temporarily unavailable on OpenRouter "
            f"({model_name}). Try again in a moment or use a different model."
        )
    if status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        return f"OpenRouter rate-limited {_source_label(source_type).lower()} quiz generation. Try again shortly."
    if status_code in {500, 502, 504}:
        return (
            f"OpenRouter could not complete {_source_label(source_type).lower()} quiz generation right now "
            f"({model_name}). Try again shortly."
        )
    return provider_detail
