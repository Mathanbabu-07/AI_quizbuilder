from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


ManualQuestionType = Literal["mcq", "multiselect", "true_false", "fill_blank", "passage"]
ManualQuizStatus = Literal["ready"]


class ManualQuizQuestionIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(
        ...,
        validation_alias=AliasChoices("question", "question_text"),
        min_length=4,
        max_length=3000,
    )
    options: list[str] = Field(default_factory=list)
    correct_answer: str = Field(
        ...,
        validation_alias=AliasChoices("correctAnswer", "correct_answer"),
        min_length=1,
        max_length=1000,
    )
    time_per_question: int = Field(
        default=30,
        validation_alias=AliasChoices("timePerQuestion", "time_per_question", "time_limit"),
        ge=5,
        le=600,
    )
    points: int = Field(default=1, ge=1, le=1000)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        if "question" not in normalized and "question_text" in normalized:
            normalized["question"] = normalized["question_text"]
        if "correctAnswer" not in normalized and "correct_answer" not in normalized:
            answers = normalized.get("correct_answers")
            if isinstance(answers, list) and answers:
                normalized["correctAnswer"] = answers[0]
        if "timePerQuestion" not in normalized and "time_per_question" not in normalized and "time_limit" in normalized:
            normalized["timePerQuestion"] = normalized["time_limit"]
        return normalized

    @field_validator("options")
    @classmethod
    def clean_options(cls, options: list[str]) -> list[str]:
        return [" ".join(option.strip().split()) for option in options if option.strip()]

    @field_validator("correct_answer")
    @classmethod
    def clean_answer(cls, answer: str) -> str:
        return " ".join(answer.strip().split())

    @model_validator(mode="after")
    def validate_mcq(self) -> "ManualQuizQuestionIn":
        if len(self.options) != 4:
            raise ValueError("MCQ questions require exactly 4 answer options.")
        if len({option.casefold() for option in self.options}) != 4:
            raise ValueError("Answer options must be unique.")
        if self.correct_answer.casefold() not in {option.casefold() for option in self.options}:
            raise ValueError("Correct answer must match one of the options.")
        return self


class ManualQuizSaveRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    host_id: str = Field(..., min_length=12, max_length=80)
    title: str = Field(..., min_length=3, max_length=120)
    question_type: ManualQuestionType = Field(
        default="mcq",
        validation_alias=AliasChoices("questionType", "question_type"),
    )
    multiplayer: bool = True
    room_code: str | None = Field(
        default=None,
        validation_alias=AliasChoices("roomCode", "room_code"),
        max_length=16,
    )
    questions: list[ManualQuizQuestionIn] = Field(..., min_length=1, max_length=100)


class ManualQuizSummary(BaseModel):
    id: str
    title: str
    host_id: str
    question_count: int
    mode: str = "manual"
    status: ManualQuizStatus = "ready"
    question_type: ManualQuestionType = "mcq"
    multiplayer: bool = False
    room_code: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    last_edited: str | None = None


class ManualQuizResponse(ManualQuizSummary):
    questions: list[dict[str, Any]]


class ManualQuizListResponse(BaseModel):
    quizzes: list[ManualQuizSummary]
