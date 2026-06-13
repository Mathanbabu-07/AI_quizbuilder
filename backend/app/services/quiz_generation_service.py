from dataclasses import dataclass

from app.core.config import Settings
from app.models.quiz import GenerateQuizRequest, GeneratedQuiz
from app.services.gemini_service import GeminiService


@dataclass(frozen=True)
class QuizGenerationResult:
    quiz: GeneratedQuiz
    model: str


@dataclass(frozen=True)
class QuizGenerationService:
    settings: Settings

    async def generate_quiz(self, request: GenerateQuizRequest) -> QuizGenerationResult:
        model_name = self.settings.gemini_ai_model.strip() or "gemini-3.1-flash-lite"
        quiz = await GeminiService(self.settings).generate_quiz(request)
        return QuizGenerationResult(quiz=quiz, model=model_name)
