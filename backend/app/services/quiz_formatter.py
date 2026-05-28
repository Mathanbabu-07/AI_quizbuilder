from typing import Any

from app.models.quiz import GeneratedQuiz


def quiz_to_public_dict(quiz: GeneratedQuiz) -> dict[str, Any]:
    return quiz.model_dump(by_alias=True)


def quiz_to_storage_dict(quiz: GeneratedQuiz) -> dict[str, Any]:
    return quiz_to_public_dict(quiz)
