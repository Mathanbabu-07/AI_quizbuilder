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
    VerifyQuizRequest,
    VerifyQuizResponse,
)
from app.services.multiplayer_service import create_persistent_room_async
from app.services.openrouter_service import QuizGenerationSettings, generate_quiz_with_model
from app.services.pdf_extractor import PDFExtractor
from app.services.ppt_extractor import PPTExtractor
from app.services.quiz_formatter import quiz_to_storage_dict
from app.services.quiz_validator import validate_quiz_payload
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/pdf-quiz", tags=["pdf-quiz"])
logger = logging.getLogger("genquiz.pdf_quiz")


@dataclass
class CachedExtraction:
    filename: str
    file_type: str
    text: str
    created_at: float


_extraction_cache: dict[str, CachedExtraction] = {}
_CACHE_TTL_SECONDS = 30 * 60


@router.post("/upload", response_model=FileUploadResponse)
async def upload_pdf_quiz_file(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> FileUploadResponse:
    return await upload_source_file(file, settings)


@router.post("/generate", response_model=GenerateFromFileResponse)
async def generate_pdf_quiz(
    request: GenerateFromFileRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateFromFileResponse:
    return await generate_pdf_quiz_from_request(request, settings)


@router.post("/verify", response_model=VerifyQuizResponse)
async def verify_pdf_quiz(request: VerifyQuizRequest) -> VerifyQuizResponse:
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
        source_type="pdf",
    )
    room_code: str | None = None
    if request.mode == "multiplayer":
        room_code, _ = await create_persistent_room_async(quiz_id=quiz_id, host_name=request.host_name)

    return VerifyQuizResponse(quiz=quiz, quiz_id=quiz_id, room_code=room_code)


async def upload_source_file(file: UploadFile, settings: Settings) -> FileUploadResponse:
    filename = file.filename or "uploaded-file"
    extension = _detect_file_type(filename, file.content_type)
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

    if len(extracted_text) < 80:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Not enough readable text was found in this file. If it is a scanned image PDF, export it with selectable text and upload again.",
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


async def generate_pdf_quiz_from_request(
    request: GenerateFromFileRequest,
    settings: Settings,
) -> GenerateFromFileResponse:
    _prune_cache()
    cached = _extraction_cache.get(request.file_id)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file session expired. Upload the file again.",
        )

    source_type = "pdf" if cached.file_type == "pdf" else "file"
    quiz = await generate_quiz_with_model(
        settings.openrouter_file_model,
        cached.text,
        QuizGenerationSettings.from_file_request(
            settings,
            request,
            source_type=source_type,
        ),
    )
    quiz_id = await supabase_service.save_generated_quiz_async(
        title=quiz.title,
        quiz_data=quiz_to_storage_dict(quiz),
        mode=request.mode,
        host_id=request.host_id,
        source_type=cached.file_type,
    )

    room_code: str | None = None
    room_id: str | None = None
    if request.mode == "multiplayer":
        room_code, room_id = await create_persistent_room_async(quiz_id=quiz_id, host_name=request.host_name)

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


def _prune_cache() -> None:
    expires_before = time.time() - _CACHE_TTL_SECONDS
    expired_keys = [key for key, value in _extraction_cache.items() if value.created_at < expires_before]
    for key in expired_keys:
        _extraction_cache.pop(key, None)


def _detect_file_type(filename: str, content_type: str | None) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension in {"pdf", "pptx"}:
        return extension

    normalized_type = (content_type or "").lower()
    if normalized_type == "application/pdf":
        return "pdf"
    if normalized_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return "pptx"

    return extension
