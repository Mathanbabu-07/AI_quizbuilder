import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings
from app.models.quiz import GenerateFromFileRequest, GeneratedQuiz
from app.services.prompt_builder import build_file_quiz_prompt
from app.services.quiz_validator import QuizValidationError, validate_quiz_payload
from app.utils.json_tools import extract_json_object

logger = logging.getLogger("genquiz.file_ai")


@dataclass
class AIQuizGenerator:
    settings: Settings

    async def generate_from_text(
        self,
        request: GenerateFromFileRequest,
        source_text: str,
        *,
        model: str | None = None,
    ) -> GeneratedQuiz:
        if not self.settings.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenRouter API key is missing. Add OPENROUTER_API_KEY in backend/.env and restart the backend.",
            )

        compact_source = _chunk_source_text(source_text)
        payload = {
            "model": model or self.settings.openrouter_file_model,
            "messages": build_file_quiz_prompt(request, compact_source),
            "temperature": 0.18,
            "top_p": 0.82,
            "max_tokens": min(7600, 540 + request.question_count * 135),
        }
        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.frontend_url,
            "X-Title": "GENQUIZ",
        }
        url = f"{self.settings.openrouter_base_url}/chat/completions"
        deadline = time.monotonic() + min(120.0, max(30.0, self.settings.generation_timeout_seconds))
        last_error: Exception | None = None

        for attempt in range(2):
            remaining = deadline - time.monotonic()
            if remaining <= 1:
                break

            try:
                payload["temperature"] = 0.08 if attempt else 0.18
                timeout = httpx.Timeout(max(5.0, remaining - 0.5), connect=min(5.0, remaining))
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return self._parse_response(response.json(), request)
            except httpx.TimeoutException as exc:
                last_error = exc
            except httpx.HTTPStatusError as exc:
                detail = _openrouter_error_message(exc.response)
                if exc.response.status_code in {400, 401, 402, 403, 404}:
                    raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
                last_error = exc
            except (KeyError, ValueError, QuizValidationError) as exc:
                logger.warning("File quiz generation produced invalid output on attempt %s: %s", attempt + 1, exc)
                last_error = exc

            if attempt == 0:
                await asyncio.sleep(0.45)

        if isinstance(last_error, httpx.TimeoutException):
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="File quiz generation took too long. Try fewer questions or a smaller file.",
            ) from last_error

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an invalid quiz format. Try fewer questions or a cleaner file.",
        ) from last_error

    def _parse_response(self, data: dict[str, Any], request: GenerateFromFileRequest) -> GeneratedQuiz:
        content = data["choices"][0]["message"]["content"]
        parsed = extract_json_object(content)
        return validate_quiz_payload(
            parsed,
            question_count=request.question_count,
            difficulty=request.difficulty,
            time_per_question=request.time_per_question,
            points_per_question=request.points_per_question,
        )


def _chunk_source_text(source_text: str, max_characters: int = 22_000) -> str:
    paragraphs = [part.strip() for part in source_text.split("\n") if part.strip()]
    chunks: list[str] = []
    total = 0

    for paragraph in paragraphs:
        next_len = len(paragraph) + 1
        if total + next_len > max_characters:
            break
        chunks.append(paragraph)
        total += next_len

    return "\n".join(chunks)


def _openrouter_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
        message = payload.get("error", {}).get("message") or payload.get("message")
        if message:
            return f"OpenRouter error: {message}"
    except ValueError:
        pass
    return f"OpenRouter request failed with status {response.status_code}."
