from dataclasses import dataclass

from app.core.config import Settings
from app.models.quiz import GenerateFromFileRequest, GeneratedQuiz
from app.services.openrouter_service import QuizGenerationSettings, generate_quiz_with_model


@dataclass
class AIQuizGenerator:
    settings: Settings

    async def generate_from_text(
        self,
        request: GenerateFromFileRequest,
        source_text: str,
        *,
        model: str | None = None,
        source_label: str = "file",
    ) -> GeneratedQuiz:
        source_type = "url" if source_label.casefold() == "url" else "pdf"
        return await generate_quiz_with_model(
            model or self.settings.openrouter_file_model,
            source_text,
            QuizGenerationSettings.from_file_request(
                self.settings,
                request,
                source_type=source_type,
            ),
        )
