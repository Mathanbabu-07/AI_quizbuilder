from dataclasses import dataclass

from app.core.config import Settings
from app.models.quiz import GenerateQuizRequest, GeneratedQuiz
from app.services.quiz_generation_service import QuizGenerationService


@dataclass(frozen=True)
class AIQuizGenerationResult:
    quiz: GeneratedQuiz
    model: str


@dataclass(frozen=True)
class AIQuizPipeline:
    settings: Settings

    async def generate(self, request: GenerateQuizRequest) -> AIQuizGenerationResult:
        result = await QuizGenerationService(self.settings).generate_quiz(request)
        return AIQuizGenerationResult(quiz=result.quiz, model=result.model)
