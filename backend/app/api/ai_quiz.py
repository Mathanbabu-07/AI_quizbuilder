import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import Settings, get_settings
from app.models.quiz import GenerateQuizRequest, GenerateQuizResponse, VerifyQuizRequest, VerifyQuizResponse
from app.services.ai_quiz_pipeline import AIQuizPipeline
from app.services.multiplayer_service import create_persistent_room_async
from app.services.quiz_formatter import quiz_to_storage_dict
from app.services.quiz_validator import validate_quiz_payload
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/ai-quiz", tags=["ai-quiz"])
logger = logging.getLogger("genquiz.ai_quiz")


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_ai_quiz(
    request: GenerateQuizRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateQuizResponse:
    logger.info(
        "AI quiz generation request count=%s difficulty=%s time_per_question=%s prompt_len=%s",
        request.question_count,
        request.difficulty,
        request.time_per_question,
        len(request.prompt),
    )
    result = await AIQuizPipeline(settings).generate(request)

    return GenerateQuizResponse(
        quiz=result.quiz,
        meta={
            "model": result.model,
            "question_count": len(result.quiz.questions),
            "difficulty": request.difficulty,
            "time_per_question": request.time_per_question,
            "total_quiz_time": request.total_quiz_time,
            "points_per_question": request.points_per_question,
        },
    )


@router.post("/verify", response_model=VerifyQuizResponse)
async def verify_ai_quiz(request: VerifyQuizRequest) -> VerifyQuizResponse:
    if not request.quiz.questions:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot verify an empty quiz.")

    quiz = validate_quiz_payload(
        request.quiz.model_dump(by_alias=True),
        question_count=len(request.quiz.questions),
        difficulty=request.quiz.questions[0].difficulty if request.quiz.questions else "Medium",
        time_per_question=request.quiz.questions[0].time_limit if request.quiz.questions else 30,
        points_per_question=request.quiz.questions[0].points if request.quiz.questions else 1,
    )
    quiz_id = await supabase_service.save_generated_quiz_async(
        title=quiz.title,
        quiz_data=quiz_to_storage_dict(quiz),
        mode=request.mode,
        host_id=request.host_id,
        source_type="ai",
    )
    room_code: str | None = None
    if request.mode == "multiplayer":
        room_code, _ = await create_persistent_room_async(quiz_id=quiz_id, host_name=request.host_name)

    return VerifyQuizResponse(quiz=quiz, quiz_id=quiz_id, room_code=room_code)
