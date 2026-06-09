from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_serializer, model_validator

Difficulty = Literal["Easy", "Medium", "Hard", "Very Hard"]


class GenerateQuizRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500)
    question_count: int = Field(..., ge=10, le=50)
    difficulty: Difficulty
    time_per_question: int = Field(..., ge=5, le=300)
    total_quiz_time: int = Field(..., ge=1, le=120)
    points_per_question: int = Field(default=1, ge=1, le=10)
    progress_id: str | None = Field(default=None, min_length=8, max_length=80)


class QuizQuestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(..., min_length=8, max_length=500)
    choices: list[str] = Field(
        ...,
        validation_alias=AliasChoices("choices", "options"),
        serialization_alias="options",
        min_length=4,
        max_length=4,
    )
    correct_answer: str = Field(
        ...,
        validation_alias=AliasChoices("correct_answer", "correctAnswer"),
        serialization_alias="correctAnswer",
        min_length=1,
        max_length=240,
    )
    explanation: str = Field(default="", max_length=600)
    difficulty: Difficulty = "Medium"
    time_limit: int = Field(
        default=30,
        validation_alias=AliasChoices("time_limit", "timeLimit"),
        serialization_alias="timeLimit",
        ge=5,
        le=300,
    )
    points: int = Field(default=1, ge=1, le=10)

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

    @model_serializer
    def serialize_model(self) -> dict[str, object]:
        return {
            "question": self.question,
            "options": self.choices,
            "correctAnswer": self.correct_answer,
            "explanation": self.explanation,
            "timeLimit": self.time_limit,
            "points": self.points,
        }


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


class GenerateQuizProgressResponse(BaseModel):
    progress_id: str
    progress: int = Field(..., ge=0, le=100)
    stage: str
    status: Literal["pending", "running", "complete", "error"]


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_type: Literal["pdf", "pptx"]
    extracted_characters: int
    preview: str


class GenerateFromFileRequest(BaseModel):
    file_id: str = Field(..., min_length=8, max_length=80)
    user_prompt: str | None = Field(default=None, max_length=900)
    mode: Literal["solo", "multiplayer"] = "solo"
    question_count: int = Field(..., ge=5, le=50)
    difficulty: Difficulty
    time_per_question: int = Field(..., ge=5, le=300)
    points_per_question: int = Field(default=1, ge=1, le=10)
    host_id: str | None = Field(default=None, max_length=80)
    host_name: str = Field(default="Host", min_length=1, max_length=40)


class GenerateFromFileResponse(BaseModel):
    quiz: GeneratedQuiz
    meta: dict[str, int | str | None]


class UrlExtractRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=2048)


class UrlExtractResponse(BaseModel):
    extraction_id: str
    url: str
    title: str | None = None
    extracted_characters: int
    preview: str


class GenerateFromUrlRequest(BaseModel):
    extraction_id: str | None = Field(default=None, min_length=8, max_length=80)
    url: str | None = Field(default=None, min_length=8, max_length=2048)
    user_prompt: str | None = Field(default=None, max_length=900)
    mode: Literal["solo", "multiplayer"] = "solo"
    question_count: int = Field(..., ge=5, le=50)
    difficulty: Difficulty
    time_per_question: int = Field(..., ge=5, le=300)
    points_per_question: int = Field(default=1, ge=1, le=10)
    host_id: str | None = Field(default=None, max_length=80)
    host_name: str = Field(default="Host", min_length=1, max_length=40)

    @model_validator(mode="after")
    def validate_source(self) -> "GenerateFromUrlRequest":
        if not self.extraction_id and not self.url:
            raise ValueError("Provide extraction_id or url.")
        return self


class GenerateFromUrlResponse(BaseModel):
    quiz: GeneratedQuiz
    meta: dict[str, int | str | None]


class VerifyQuizRequest(BaseModel):
    quiz: GeneratedQuiz
    mode: Literal["solo", "multiplayer"] = "solo"
    host_id: str | None = Field(default=None, max_length=80)
    host_name: str = Field(default="Host", min_length=1, max_length=40)


class VerifyQuizResponse(BaseModel):
    quiz: GeneratedQuiz
    quiz_id: str | None = None
    room_code: str | None = None


class ErrorResponse(BaseModel):
    detail: str
