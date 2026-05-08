import asyncio
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import Settings
from app.models.quiz import GenerateQuizRequest, GeneratedQuiz
from app.prompts.quiz_prompt import build_quiz_prompt
from app.utils.json_tools import extract_json_object

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


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
            "temperature": 0.55,
            "top_p": 0.9,
            "max_tokens": min(12000, 900 + request.question_count * 240),
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.frontend_origin,
            "X-Title": "GENQUIZ",
        }

        last_error: Exception | None = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(90.0, connect=15.0)) as client:
                    response = await client.post(OPENROUTER_CHAT_URL, json=payload, headers=headers)
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
                last_error = exc

            await asyncio.sleep(0.8 * (attempt + 1))

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI quiz generation failed. {str(last_error) if last_error else 'Please try again.'}",
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
