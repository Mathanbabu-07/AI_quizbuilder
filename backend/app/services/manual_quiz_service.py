from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.models.manual_quiz import ManualQuizSaveRequest

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
        rows = self._supabase_request(
            "GET",
            "manual_quizzes",
            params={
                "select": "id,title,host_id,question_type,total_questions,multiplayer,room_code,created_at,updated_at",
                "host_id": f"eq.{host_id}",
                "order": "updated_at.desc",
                "limit": "30",
            },
        )
        quizzes = [self._map_quiz_summary(row) for row in rows]
        logger.info("manual quizzes loaded host_id=%s count=%s", host_id, len(quizzes))
        return quizzes

    def _get_quiz_sync(self, quiz_id: str, host_id: str) -> dict[str, Any]:
        quiz = self._fetch_quiz_row(quiz_id, host_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

        question_rows = self._supabase_request(
            "GET",
            "manual_questions",
            params={
                "select": (
                    "id,quiz_id,question_index,question_text,option_a,option_b,option_c,option_d,"
                    "correct_answer,time_per_question,points,created_at"
                ),
                "quiz_id": f"eq.{quiz_id}",
                "order": "question_index.asc",
            },
        )
        questions = [self._map_question(row) for row in question_rows]
        logger.info("manual quiz opened quiz_id=%s host_id=%s questions=%s", quiz_id, host_id, len(questions))

        payload = self._map_quiz_summary(quiz)
        payload["questions"] = questions
        return payload

    def _save_quiz_sync(self, request: ManualQuizSaveRequest, quiz_id: str | None) -> dict[str, Any]:
        room_code = self._normalize_room_code(request.room_code)
        quiz_payload = {
            "title": request.title.strip(),
            "host_id": request.host_id,
            "question_type": request.question_type,
            "total_questions": len(request.questions),
            "multiplayer": request.multiplayer,
            "room_code": room_code,
        }
        logger.info(
            "manual quiz save requested host_id=%s quiz_id=%s title=%s questions=%s multiplayer=%s room_code=%s",
            request.host_id,
            quiz_id or "new",
            request.title,
            len(request.questions),
            request.multiplayer,
            room_code,
        )

        saved_quiz: dict[str, Any] | None = None
        try:
            if quiz_id:
                existing = self._fetch_quiz_row(quiz_id, request.host_id)
                if not existing:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

                updated_rows = self._supabase_request(
                    "PATCH",
                    "manual_quizzes",
                    params={"id": f"eq.{quiz_id}", "host_id": f"eq.{request.host_id}"},
                    json_payload=quiz_payload,
                    prefer_return=True,
                )
                saved_quiz = (updated_rows or [None])[0]
                self._supabase_request("DELETE", "manual_questions", params={"quiz_id": f"eq.{quiz_id}"})
            else:
                inserted_rows = self._supabase_request(
                    "POST",
                    "manual_quizzes",
                    json_payload=quiz_payload,
                    prefer_return=True,
                )
                saved_quiz = (inserted_rows or [None])[0]

            if not saved_quiz:
                raise RuntimeError("Supabase did not return the saved quiz row.")

            question_rows = self._build_question_rows(saved_quiz["id"], request)
            if question_rows:
                self._supabase_request("POST", "manual_questions", json_payload=question_rows, prefer_return=True)
            logger.info("manual quiz questions saved quiz_id=%s count=%s", saved_quiz["id"], len(question_rows))

            if request.multiplayer and room_code:
                self._replace_multiplayer_room(saved_quiz["id"], room_code)

            response = self._map_quiz_summary(saved_quiz)
            response["questions"] = [self._map_question(row) for row in question_rows]
            return response
        except Exception:
            if not quiz_id and saved_quiz and saved_quiz.get("id"):
                try:
                    self._supabase_request("DELETE", "manual_quizzes", params={"id": f"eq.{saved_quiz['id']}"})
                except Exception:
                    logger.warning("manual quiz rollback failed quiz_id=%s", saved_quiz["id"], exc_info=True)
            raise

    def _delete_quiz_sync(self, quiz_id: str, host_id: str) -> None:
        existing = self._fetch_quiz_row(quiz_id, host_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved quiz not found.")

        self._supabase_request("DELETE", "manual_quizzes", params={"id": f"eq.{quiz_id}", "host_id": f"eq.{host_id}"})
        logger.info("manual quiz deleted quiz_id=%s host_id=%s", quiz_id, host_id)

    def _fetch_quiz_row(self, quiz_id: str, host_id: str) -> dict[str, Any] | None:
        rows = self._supabase_request(
            "GET",
            "manual_quizzes",
            params={
                "select": "id,title,host_id,question_type,total_questions,multiplayer,room_code,created_at,updated_at",
                "id": f"eq.{quiz_id}",
                "host_id": f"eq.{host_id}",
                "limit": "1",
            },
        )
        return (rows or [None])[0]

    def _replace_multiplayer_room(self, quiz_id: str, room_code: str) -> None:
        self._supabase_request("DELETE", "multiplayer_rooms", params={"quiz_id": f"eq.{quiz_id}"})
        self._supabase_request(
            "POST",
            "multiplayer_rooms",
            json_payload={
                "quiz_id": quiz_id,
                "room_code": room_code,
                "host_name": "Host",
                "started": False,
            },
            prefer_return=True,
        )
        logger.info("manual quiz multiplayer room linked quiz_id=%s room_code=%s", quiz_id, room_code)

    def _supabase_request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json_payload: Any | None = None,
        prefer_return: bool = False,
    ) -> list[dict[str, Any]]:
        settings = get_settings()
        if not settings.supabase_url:
            raise RuntimeError("SUPABASE_URL is missing.")
        if not settings.supabase_service_role_key:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing.")

        headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer_return:
            headers["Prefer"] = "return=representation"

        url = f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"
        with httpx.Client(timeout=httpx.Timeout(20.0, connect=8.0), http2=False) as client:
            response = client.request(method, url, params=params, json=json_payload, headers=headers)

        if response.status_code >= 400:
            raise RuntimeError(f"Supabase {table} {method} failed ({response.status_code}): {response.text[:700]}")
        if not response.content:
            return []
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return []

    @staticmethod
    def _build_question_rows(quiz_id: str, request: ManualQuizSaveRequest) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for index, question in enumerate(request.questions):
            rows.append(
                {
                    "quiz_id": quiz_id,
                    "question_index": index,
                    "question_text": question.question.strip(),
                    "option_a": question.options[0],
                    "option_b": question.options[1],
                    "option_c": question.options[2],
                    "option_d": question.options[3],
                    "correct_answer": question.correct_answer,
                    "time_per_question": question.time_per_question,
                    "points": question.points,
                }
            )
        return rows

    @staticmethod
    def _map_quiz_summary(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "title": row["title"],
            "host_id": row.get("host_id") or "",
            "question_count": row.get("total_questions") or 0,
            "mode": "manual",
            "status": "ready",
            "question_type": row.get("question_type") or "mcq",
            "multiplayer": bool(row.get("multiplayer")),
            "room_code": row.get("room_code"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at") or row.get("created_at"),
            "last_edited": row.get("updated_at") or row.get("created_at"),
        }

    @staticmethod
    def _map_question(row: dict[str, Any]) -> dict[str, Any]:
        options = [row.get("option_a") or "", row.get("option_b") or "", row.get("option_c") or "", row.get("option_d") or ""]
        return {
            "question_text": row.get("question_text") or "",
            "question_type": "mcq",
            "options": options,
            "correct_answers": [row.get("correct_answer") or ""],
            "points": row.get("points") or 1,
            "time_limit": row.get("time_per_question") or 30,
            "order_index": row.get("question_index") or 0,
        }

    @staticmethod
    def _normalize_room_code(room_code: str | None) -> str | None:
        normalized = "".join((room_code or "").upper().split())
        return normalized or None

    @staticmethod
    def _safe_error(exc: Exception) -> str:
        raw_message = str(exc).strip()
        if not raw_message:
            raw_message = exc.__class__.__name__

        redacted = raw_message.replace("\n", " ")
        for marker in ("eyJ", "Bearer "):
            if marker in redacted:
                redacted = redacted.split(marker)[0].strip() or "Supabase rejected the request."
        return redacted[:700]


manual_quiz_service = ManualQuizService()
