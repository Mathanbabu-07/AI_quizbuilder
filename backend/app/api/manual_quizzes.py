from fastapi import APIRouter, Query, Response, status

from app.models.manual_quiz import ManualQuizListResponse, ManualQuizResponse, ManualQuizSaveRequest
from app.services.manual_quiz_service import manual_quiz_service

router = APIRouter(prefix="/api/manual-quizzes", tags=["manual quizzes"])


@router.get("", response_model=ManualQuizListResponse)
async def list_manual_quizzes(host_id: str = Query(..., min_length=12, max_length=80)) -> ManualQuizListResponse:
    quizzes = await manual_quiz_service.list_quizzes(host_id)
    return ManualQuizListResponse(quizzes=quizzes)


@router.get("/{quiz_id}", response_model=ManualQuizResponse)
async def get_manual_quiz(
    quiz_id: str,
    host_id: str = Query(..., min_length=12, max_length=80),
) -> ManualQuizResponse:
    quiz = await manual_quiz_service.get_quiz(quiz_id, host_id)
    return ManualQuizResponse(**quiz)


@router.post("", response_model=ManualQuizResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_quiz(request: ManualQuizSaveRequest) -> ManualQuizResponse:
    quiz = await manual_quiz_service.save_quiz(request)
    return ManualQuizResponse(**quiz)


@router.put("/{quiz_id}", response_model=ManualQuizResponse)
async def update_manual_quiz(quiz_id: str, request: ManualQuizSaveRequest) -> ManualQuizResponse:
    quiz = await manual_quiz_service.save_quiz(request, quiz_id)
    return ManualQuizResponse(**quiz)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_manual_quiz(
    quiz_id: str,
    host_id: str = Query(..., min_length=12, max_length=80),
) -> Response:
    await manual_quiz_service.delete_quiz(quiz_id, host_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
