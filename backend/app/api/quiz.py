import logging
import time
from dataclasses import dataclass
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.models.quiz import (
    FileUploadResponse,
    GenerateFromFileRequest,
    GenerateFromFileResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    VerifyQuizRequest,
    VerifyQuizResponse,
)
from app.services.ai_generator import AIQuizGenerator
from app.services.multiplayer_service import create_persistent_room
from app.services.openrouter_service import OpenRouterService
from app.services.pdf_extractor import PDFExtractor
from app.services.ppt_extractor import PPTExtractor
from app.services.quiz_validator import validate_quiz_payload
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])
logger = logging.getLogger("genquiz.quiz")


@dataclass
class CachedExtraction:
    filename: str
    file_type: str
    text: str
    created_at: float


_extraction_cache: dict[str, CachedExtraction] = {}
_CACHE_TTL_SECONDS = 30 * 60


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
            "points_per_question": request.points_per_question,
        },
    )


@router.post("/upload", response_model=FileUploadResponse)
async def upload_quiz_file(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> FileUploadResponse:
    filename = file.filename or "uploaded-file"
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in {"pdf", "pptx"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a supported PDF or PPTX file.",
        )

    payload = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(payload) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Max upload size is {settings.max_upload_mb}MB.",
        )

    if extension == "pdf":
        extracted_text = await PDFExtractor().extract_text(payload)
    else:
        extracted_text = await PPTExtractor().extract_text(payload)

    if len(extracted_text) < 180:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Not enough readable text was found in this file.",
        )

    _prune_cache()
    file_id = uuid4().hex
    _extraction_cache[file_id] = CachedExtraction(
        filename=filename,
        file_type=extension,
        text=extracted_text,
        created_at=time.time(),
    )

    logger.info("File uploaded for quiz generation filename=%s type=%s chars=%s", filename, extension, len(extracted_text))
    return FileUploadResponse(
        file_id=file_id,
        filename=filename,
        file_type=extension,
        extracted_characters=len(extracted_text),
        preview=extracted_text[:420],
    )


@router.post("/generate-from-file", response_model=GenerateFromFileResponse)
async def generate_quiz_from_file(
    request: GenerateFromFileRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateFromFileResponse:
    _prune_cache()
    cached = _extraction_cache.get(request.file_id)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file session expired. Upload the file again.",
        )

    generator = AIQuizGenerator(settings)
    quiz = await generator.generate_from_text(request, cached.text)
    quiz_data = quiz.model_dump()
    quiz_id = supabase_service.save_generated_quiz(
        title=quiz.title,
        quiz_data=quiz_data,
        mode=request.mode,
        host_id=request.host_id,
    )
    room_code: str | None = None
    room_id: str | None = None
    if request.mode == "multiplayer":
        room_code, room_id = create_persistent_room(quiz_id=quiz_id, host_name=request.host_name)

    return GenerateFromFileResponse(
        quiz=quiz,
        meta={
            "model": settings.openrouter_file_model,
            "source_file": cached.filename,
            "source_type": cached.file_type,
            "question_count": len(quiz.questions),
            "quiz_id": quiz_id,
            "room_code": room_code,
            "room_id": room_id,
        },
    )


@router.post("/verify", response_model=VerifyQuizResponse)
async def verify_generated_quiz(request: VerifyQuizRequest) -> VerifyQuizResponse:
    if not request.quiz.questions:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot verify an empty quiz.")

    quiz = validate_quiz_payload(
        request.quiz.model_dump(),
        question_count=len(request.quiz.questions),
        difficulty=request.quiz.questions[0].difficulty if request.quiz.questions else "Medium",
        time_per_question=request.quiz.questions[0].time_limit if request.quiz.questions else 30,
        points_per_question=request.quiz.questions[0].points if request.quiz.questions else 1,
    )
    quiz_id = supabase_service.save_generated_quiz(
        title=quiz.title,
        quiz_data=quiz.model_dump(),
        mode=request.mode,
        host_id=request.host_id,
    )
    room_code: str | None = None
    if request.mode == "multiplayer":
        room_code, _ = create_persistent_room(quiz_id=quiz_id, host_name=request.host_name)

    return VerifyQuizResponse(quiz=quiz, quiz_id=quiz_id, room_code=room_code)


def _prune_cache() -> None:
    expires_before = time.time() - _CACHE_TTL_SECONDS
    expired_keys = [key for key, value in _extraction_cache.items() if value.created_at < expires_before]
    for key in expired_keys:
        _extraction_cache.pop(key, None)
