from typing import Any

from pydantic import ValidationError

from app.models.quiz import Difficulty, GeneratedQuiz


class QuizValidationError(ValueError):
    pass


def validate_quiz_payload(
    payload: dict[str, Any],
    *,
    question_count: int,
    difficulty: Difficulty,
    time_per_question: int,
    points_per_question: int,
) -> GeneratedQuiz:
    try:
        quiz = GeneratedQuiz.model_validate(payload)
    except ValidationError as exc:
        raise QuizValidationError(str(exc)) from exc

    if len(quiz.questions) != question_count:
        raise QuizValidationError(f"Generated {len(quiz.questions)} questions, expected {question_count}.")

    normalized_questions: set[str] = set()
    for question in quiz.questions:
        key = " ".join(question.question.casefold().split())
        if key in normalized_questions:
            raise QuizValidationError("Duplicate questions are not allowed.")
        normalized_questions.add(key)

        if question.difficulty != difficulty:
            raise QuizValidationError("AI response did not maintain the requested difficulty.")

        question.time_limit = time_per_question
        question.points = points_per_question

    return quiz
