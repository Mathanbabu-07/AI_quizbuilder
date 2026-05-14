from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


ManualQuestionType = Literal["mcq", "multiselect", "true_false", "fill_blank", "passage"]
ManualQuizStatus = Literal["draft", "ready", "archived"]


class ManualQuizQuestionIn(BaseModel):
    question_text: str = Field(..., min_length=4, max_length=3000)
    question_type: ManualQuestionType = "mcq"
    options: list[str] = Field(default_factory=list)
    correct_answers: list[str] = Field(default_factory=list)
    points: int = Field(..., ge=1, le=1000)
    time_limit: int = Field(..., ge=5, le=600)
    order_index: int = Field(..., ge=0)

    @field_validator("options")
    @classmethod
    def clean_options(cls, options: list[str]) -> list[str]:
        return [option.strip() for option in options if option.strip()]

    @field_validator("correct_answers")
    @classmethod
    def clean_answers(cls, answers: list[str]) -> list[str]:
        return [answer.strip() for answer in answers if answer.strip()]

    @model_validator(mode="after")
    def validate_mcq(self) -> "ManualQuizQuestionIn":
        if self.question_type != "mcq":
            return self

        if len(self.options) != 4:
            raise ValueError("MCQ questions require exactly 4 answer options.")
        if len({option.casefold() for option in self.options}) != 4:
            raise ValueError("Answer options must be unique.")
        if len(self.correct_answers) != 1:
            raise ValueError("Select exactly one correct answer.")
        if self.correct_answers[0].casefold() not in {option.casefold() for option in self.options}:
            raise ValueError("Correct answer must match one of the options.")
        return self


class ManualQuizSaveRequest(BaseModel):
    host_id: str = Field(..., min_length=12, max_length=80)
    title: str = Field(..., min_length=3, max_length=120)
    mode: str = Field(default="manual", max_length=40)
    status: ManualQuizStatus = "draft"
    questions: list[ManualQuizQuestionIn] = Field(default_factory=list)


class ManualQuizSummary(BaseModel):
    id: str
    title: str
    host_id: str
    question_count: int
    mode: str
    status: ManualQuizStatus
    created_at: str | None = None
    updated_at: str | None = None
    last_edited: str | None = None


class ManualQuizResponse(ManualQuizSummary):
    questions: list[dict[str, Any]]


class ManualQuizListResponse(BaseModel):
    quizzes: list[ManualQuizSummary]
