import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import Settings
from app.models.quiz import GenerateQuizRequest, GeneratedQuiz
from app.prompts.quiz_prompt import build_quiz_prompt
from app.utils.json_tools import extract_json_object

logger = logging.getLogger("genquiz.openrouter")


@dataclass
class OpenRouterService:
    settings: Settings

    async def generate_quiz(self, request: GenerateQuizRequest) -> GeneratedQuiz:
        if not self.settings.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenRouter API key is missing. Add OPENROUTER_API_KEY in backend/.env and restart the backend.",
            )

        payload = {
            "model": self.settings.openrouter_model,
            "messages": build_quiz_prompt(request),
            "temperature": 0.28,
            "top_p": 0.82,
            "max_tokens": min(7600, 520 + request.question_count * 125),
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.frontend_url,
            "X-Title": "GENQUIZ",
        }

        last_error: Exception | None = None
        deadline = time.monotonic() + min(120.0, max(30.0, self.settings.generation_timeout_seconds))

        for attempt in range(3):
            remaining = deadline - time.monotonic()
            if remaining <= 1.0:
                break

            try:
                payload["temperature"] = 0.12 if attempt else 0.28
                request_timeout = max(4.0, remaining - 0.5)
                timeout = httpx.Timeout(request_timeout, connect=min(5.0, request_timeout))

                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        f"{self.settings.openrouter_base_url}/chat/completions",
                        json=payload,
                        headers=headers,
                    )
                response.raise_for_status()
                return self._parse_response(response.json(), request)
            except httpx.TimeoutException as exc:
                last_error = exc
            except httpx.HTTPStatusError as exc:
                detail = self._openrouter_error_message(exc.response)
                if exc.response.status_code in {400, 401, 402, 403, 404}:
                    raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
                last_error = exc
            except (ValueError, KeyError, ValidationError) as exc:
                logger.warning("OpenRouter returned unusable quiz JSON on attempt %s: %s", attempt + 1, exc)
                last_error = exc

            remaining = deadline - time.monotonic()
            if attempt < 2 and remaining > 2.0:
                await asyncio.sleep(min(0.6, remaining / 4))

        if isinstance(last_error, httpx.TimeoutException) or (deadline - time.monotonic()) <= 1.0:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI quiz generation took too long. Try fewer questions or generate again.",
            ) from last_error

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI quiz generation returned an invalid format. Please try again with a simpler topic or fewer questions.",
        )

    def _parse_response(self, data: dict[str, Any], request: GenerateQuizRequest) -> GeneratedQuiz:
        content = data["choices"][0]["message"]["content"]
        parsed = extract_json_object(content)
        quiz = GeneratedQuiz.model_validate(parsed)

        if len(quiz.questions) != request.question_count:
            raise ValueError(
                f"AI generated {len(quiz.questions)} questions, expected {request.question_count}."
            )

        invalid_difficulty = [
            question.difficulty for question in quiz.questions if question.difficulty != request.difficulty
        ]
        if invalid_difficulty:
            raise ValueError("AI response did not maintain the requested difficulty.")

        for question in quiz.questions:
            question.time_limit = request.time_per_question
            question.points = request.points_per_question

        return quiz

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
