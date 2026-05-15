from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.models.manual_quiz import ManualQuizSaveRequest
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger("genquiz.manual_quizzes")


class ManualQuizService:
    async def list_quizzes(self, host_id: str) -> list[dict[str, Any]]:
        try:
            return await run_in_threadpool(self._list_quizzes_sync, host_id)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("manual quiz list failed host_id=%s", host_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Saved quizzes could not be loaded. {self._safe_error(exc)}",
            ) from exc

    async def get_quiz(self, quiz_id: str, host_id: str) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._get_quiz_sync, quiz_id, host_id)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("manual quiz fetch failed quiz_id=%s host_id=%s", quiz_id, host_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Saved quiz could not be opened. {self._safe_error(exc)}",
            ) from exc

    async def save_quiz(self, request: ManualQuizSaveRequest, quiz_id: str | None = None) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._save_quiz_sync, request, quiz_id)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("manual quiz save failed quiz_id=%s host_id=%s", quiz_id, request.host_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Quiz could not be saved to Supabase. {self._safe_error(exc)}",
            ) from exc

    async def delete_quiz(self, quiz_id: str, host_id: str) -> None:
        try:
            await run_in_threadpool(self._delete_quiz_sync, quiz_id, host_id)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("manual quiz delete failed quiz_id=%s host_id=%s", quiz_id, host_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Saved quiz could not be deleted. {self._safe_error(exc)}",
            ) from exc

    def _list_quizzes_sync(self, host_id: str) -> list[dict[str, Any]]:
        client = get_supabase_client()
        response = (
            client.table("quizzes")
            .select("id,title,host_id,question_count,mode,status,created_at,updated_at")
            .eq("host_id", host_id)
            .neq("status", "archived")
            .order("updated_at", desc=True)
            .limit(30)
            .execute()
        )
        return response.data or []

    def _get_quiz_sync(self, quiz_id: str, host_id: str) -> dict[str, Any]:
        client = get_supabase_client()
        quiz_response = (
            client.table("quizzes")
            .select("id,title,host_id,question_count,mode,status,created_at,updated_at")
            .eq("id", quiz_id)
            .eq("host_id", host_id)
            .neq("status", "archived")
            .limit(1)
            .execute()
        )

        quiz = (quiz_response.data or [None])[0]
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

        questions_response = (
            client.table("quiz_questions")
            .select("id,quiz_id,question_text,question_type,options,correct_answers,points,time_limit,order_index")
            .eq("quiz_id", quiz_id)
            .order("order_index")
            .execute()
        )

        quiz["questions"] = questions_response.data or []
        return quiz

    def _save_quiz_sync(self, request: ManualQuizSaveRequest, quiz_id: str | None) -> dict[str, Any]:
        client = get_supabase_client()
        logger.info(
            "manual quiz save requested host_id=%s quiz_id=%s title=%s questions=%s",
            request.host_id,
            quiz_id or "new",
            request.title,
            len(request.questions),
        )
        quiz_payload = {
            "title": request.title.strip(),
            "host_id": request.host_id,
            "question_count": len(request.questions),
            "mode": request.mode,
            "status": request.status,
        }

        if quiz_id:
            existing = (
                client.table("quizzes")
                .select("id")
                .eq("id", quiz_id)
                .eq("host_id", request.host_id)
                .neq("status", "archived")
                .limit(1)
                .execute()
            )
            if not existing.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

            client.table("quizzes").update(quiz_payload).eq("id", quiz_id).eq("host_id", request.host_id).execute()
            saved_quiz = self._fetch_quiz_row(client, quiz_id, request.host_id)
            client.table("quiz_questions").delete().eq("quiz_id", quiz_id).execute()
        else:
            quiz_response = client.table("quizzes").insert(quiz_payload).execute()
            saved_quiz = (quiz_response.data or [None])[0]
            logger.info("manual quiz inserted quiz_id=%s host_id=%s", saved_quiz.get("id") if saved_quiz else None, request.host_id)

        if not saved_quiz:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save quiz.")

        question_rows = [
            {
                "quiz_id": saved_quiz["id"],
                "question_text": question.question_text,
                "question_type": question.question_type,
                "options": question.options,
                "correct_answers": question.correct_answers,
                "points": question.points,
                "time_limit": question.time_limit,
                "order_index": question.order_index,
            }
            for question in request.questions
        ]

        if question_rows:
            client.table("quiz_questions").insert(question_rows).execute()
            logger.info("manual quiz questions inserted quiz_id=%s count=%s", saved_quiz["id"], len(question_rows))

        try:
            client.table("saved_quizzes").upsert(
                {
                    "host_id": request.host_id,
                    "quiz_id": saved_quiz["id"],
                    "draft_status": request.status,
                },
                on_conflict="host_id,quiz_id",
            ).execute()
        except Exception:
            logger.warning(
                "saved_quizzes metadata upsert failed quiz_id=%s host_id=%s",
                saved_quiz["id"],
                request.host_id,
                exc_info=True,
            )

        saved_quiz["questions"] = question_rows
        return saved_quiz

    def _delete_quiz_sync(self, quiz_id: str, host_id: str) -> None:
        client = get_supabase_client()
        existing = (
            client.table("quizzes")
            .select("id")
            .eq("id", quiz_id)
            .eq("host_id", host_id)
            .neq("status", "archived")
            .limit(1)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

        client.table("quizzes").update({"status": "archived"}).eq("id", quiz_id).eq("host_id", host_id).execute()

    def _fetch_quiz_row(self, client, quiz_id: str, host_id: str) -> dict[str, Any] | None:
        response = (
            client.table("quizzes")
            .select("id,title,host_id,question_count,mode,status,created_at,updated_at")
            .eq("id", quiz_id)
            .eq("host_id", host_id)
            .neq("status", "archived")
            .limit(1)
            .execute()
        )
        return (response.data or [None])[0]

    @staticmethod
    def _safe_error(exc: Exception) -> str:
        raw_message = str(exc).strip()
        if not raw_message:
            raw_message = exc.__class__.__name__

        redacted = raw_message.replace("\n", " ")
        for marker in ("eyJ", "Bearer "):
            if marker in redacted:
                redacted = redacted.split(marker)[0].strip() or "Supabase rejected the request."
        return redacted[:360]


manual_quiz_service = ManualQuizService()
