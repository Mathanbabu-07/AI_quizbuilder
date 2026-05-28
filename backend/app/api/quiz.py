from fastapi import APIRouter, Depends, File, UploadFile

from app.api.ai_quiz import generate_ai_quiz, verify_ai_quiz
from app.api.pdf_quiz import generate_pdf_quiz_from_request, upload_source_file
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

router = APIRouter(prefix="/api/quiz", tags=["quiz-compat"])


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(
    request: GenerateQuizRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateQuizResponse:
    return await generate_ai_quiz(request, settings)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_quiz_file(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> FileUploadResponse:
    return await upload_source_file(file, settings)


@router.post("/generate-from-file", response_model=GenerateFromFileResponse)
async def generate_quiz_from_file(
    request: GenerateFromFileRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateFromFileResponse:
    return await generate_pdf_quiz_from_request(request, settings)


@router.post("/verify", response_model=VerifyQuizResponse)
async def verify_generated_quiz(request: VerifyQuizRequest) -> VerifyQuizResponse:
    return await verify_ai_quiz(request)
