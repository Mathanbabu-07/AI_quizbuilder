from dataclasses import dataclass

from app.core.config import Settings
from app.models.quiz import GenerateQuizRequest, GeneratedQuiz
from app.services.openrouter_service import QuizGenerationSettings, generate_quiz_with_model


@dataclass(frozen=True)
class AIQuizGenerationResult:
    quiz: GeneratedQuiz
    model: str


@dataclass(frozen=True)
class AIQuizPipeline:
    settings: Settings

    async def generate(self, request: GenerateQuizRequest) -> AIQuizGenerationResult:
        model_name = self.settings.openrouter_model
        quiz = await generate_quiz_with_model(
            model_name,
            request.prompt,
            QuizGenerationSettings.from_prompt(self.settings, request),
        )
        return AIQuizGenerationResult(quiz=quiz, model=model_name)
