import logging

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.models.quiz import GenerateQuizRequest, GenerateQuizResponse
from app.services.openrouter_service import OpenRouterService

router = APIRouter(prefix="/api/quiz", tags=["quiz"])
logger = logging.getLogger("genquiz.quiz")


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(
    request: GenerateQuizRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateQuizResponse:
    logger.info(
        "AI quiz generation request count=%s difficulty=%s time_per_question=%s total_quiz_time=%s prompt_len=%s",
        request.question_count,
        request.difficulty,
        request.time_per_question,
        request.total_quiz_time,
        len(request.prompt),
    )
    service = OpenRouterService(settings)
    quiz = await service.generate_quiz(request)

    return GenerateQuizResponse(
        quiz=quiz,
        meta={
            "model": settings.openrouter_model,
            "question_count": len(quiz.questions),
            "difficulty": request.difficulty,
            "time_per_question": request.time_per_question,
            "total_quiz_time": request.total_quiz_time,
        },
    )
