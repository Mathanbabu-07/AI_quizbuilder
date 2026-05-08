from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Difficulty = Literal["Easy", "Medium", "Hard", "Very Hard"]


class GenerateQuizRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500)
    question_count: int = Field(..., ge=10, le=50)
    difficulty: Difficulty
    time_per_question: int = Field(..., ge=5, le=300)
    total_quiz_time: int = Field(..., ge=1, le=120)


class QuizQuestion(BaseModel):
    question: str = Field(..., min_length=8, max_length=500)
    choices: list[str] = Field(..., min_length=4, max_length=4)
    correct_answer: str = Field(..., min_length=1, max_length=240)
    difficulty: Difficulty

    @field_validator("choices")
    @classmethod
    def validate_choices(cls, choices: list[str]) -> list[str]:
        cleaned = [choice.strip() for choice in choices if choice.strip()]
        if len(cleaned) != 4:
            raise ValueError("Each question must contain exactly 4 non-empty choices.")
        if len({choice.casefold() for choice in cleaned}) != 4:
            raise ValueError("Choices must be unique.")
        return cleaned

    @model_validator(mode="after")
    def validate_correct_answer(self) -> "QuizQuestion":
        normalized = {choice.casefold() for choice in self.choices}
        if self.correct_answer.strip().casefold() not in normalized:
            raise ValueError("correct_answer must exactly match one of the choices.")
        return self


class GeneratedQuiz(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    questions: list[QuizQuestion]

    @model_validator(mode="after")
    def validate_unique_questions(self) -> "GeneratedQuiz":
        seen = set()
        for item in self.questions:
            key = item.question.strip().casefold()
            if key in seen:
                raise ValueError("Duplicate questions are not allowed.")
            seen.add(key)
        return self


class GenerateQuizResponse(BaseModel):
    quiz: GeneratedQuiz
    meta: dict[str, int | str]


class ErrorResponse(BaseModel):
    detail: str
