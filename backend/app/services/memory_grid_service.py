from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.models.memory_grid import (
    MemoryGridCompleteRequest,
    MemoryGridMedal,
    MemoryGridLifelineUpdateRequest,
    MemoryGridRetryRequest,
    MemoryGridRoundProgressRequest,
    MemoryGridStartRequest,
)

logger = logging.getLogger("genquiz.memory_grid")

MAX_HEARTS = 5
ROUND_CONFIGS: dict[int, dict[str, int]] = {
    1: {"rows": 2, "cols": 2, "memorize_seconds": 10, "target_count": 3, "find_seconds": 30},
    2: {"rows": 3, "cols": 3, "memorize_seconds": 15, "target_count": 3, "find_seconds": 30},
    3: {"rows": 3, "cols": 3, "memorize_seconds": 15, "target_count": 3, "find_seconds": 30},
    4: {"rows": 4, "cols": 3, "memorize_seconds": 15, "target_count": 4, "find_seconds": 30},
    5: {"rows": 4, "cols": 4, "memorize_seconds": 15, "target_count": 4, "find_seconds": 30},
}


class MemoryGridService:
    async def start_game(self, request: MemoryGridStartRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._start_game_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid start failed player_id=%s", request.player_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid game could not be started. {self._safe_error(exc)}",
            ) from exc

    async def retry_session(self, request: MemoryGridRetryRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._retry_session_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid retry failed player_id=%s", request.player_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid retry could not be started. {self._safe_error(exc)}",
            ) from exc

    async def save_round_progress(self, request: MemoryGridRoundProgressRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._save_round_progress_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid round save failed session_id=%s round=%s", request.session_id, request.round_number)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid round progress could not be saved. {self._safe_error(exc)}",
            ) from exc

    async def update_lifelines(self, request: MemoryGridLifelineUpdateRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._update_lifelines_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid lifeline update failed session_id=%s", request.session_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid lifelines could not be updated. {self._safe_error(exc)}",
            ) from exc

    async def complete_game(self, request: MemoryGridCompleteRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._complete_game_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid completion failed session_id=%s", request.session_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid game could not be completed. {self._safe_error(exc)}",
            ) from exc

    async def list_leaderboard(self, limit: int = 25) -> list[dict[str, Any]]:
        try:
            return await run_in_threadpool(self._list_leaderboard_sync, limit)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("memory grid leaderboard load failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Memory Grid leaderboard could not be loaded. {self._safe_error(exc)}",
            ) from exc

    def _start_game_sync(self, request: MemoryGridStartRequest) -> dict[str, Any]:
        rows = self._supabase_request(
            "POST",
            "memory_grid_sessions",
            json_payload={
                "player_id": request.player_id,
                "player_name": request.player_name,
                "status": "active",
                "current_round": 1,
                "completed_rounds": 0,
                "total_score": 0,
                "hearts_remaining": MAX_HEARTS,
                "total_accuracy": 100,
                "completion_time_ms": 0,
                "result": "active",
                "medal": None,
            },
            prefer_return=True,
        )
        saved = (rows or [None])[0]
        if not saved:
            raise RuntimeError("Supabase did not return the Memory Grid session.")
        return self._map_session(saved)

    def _retry_session_sync(self, request: MemoryGridRetryRequest) -> dict[str, Any]:
        if request.previous_session_id:
            self._supabase_request(
                "PATCH",
                "memory_grid_sessions",
                params={
                    "id": f"eq.{request.previous_session_id}",
                    "player_id": f"eq.{request.player_id}",
                    "status": "eq.active",
                },
                json_payload={"status": "abandoned", "result": "abandoned"},
            )

        return self._start_game_sync(MemoryGridStartRequest(player_id=request.player_id, player_name=request.player_name))

    def _save_round_progress_sync(self, request: MemoryGridRoundProgressRequest) -> dict[str, Any]:
        session = self._fetch_session(request.session_id, request.player_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory Grid session not found.")
        if session.get("status") != "active":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Memory Grid session is already closed.")
        if request.round_number > int(session.get("current_round") or 1):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Round is not unlocked yet.")

        self._validate_round_payload(request)

        existing = self._fetch_round(request.session_id, request.round_number)
        merged_score = max(request.score, int((existing or {}).get("score") or 0))
        merged_correct = max(request.correct_targets, int((existing or {}).get("correct_targets") or 0))
        merged_wrong = max(request.wrong_attempts, int((existing or {}).get("wrong_attempts") or 0))
        merged_selections = max(request.total_selections, int((existing or {}).get("total_selections") or 0))
        merged_duration = max(request.duration_ms, int((existing or {}).get("duration_ms") or 0))
        merged_hearts = min(request.remaining_hearts, int((existing or {}).get("remaining_hearts") or MAX_HEARTS))
        merged_completed = bool(request.completed or (existing or {}).get("completed"))

        rows = self._supabase_request(
            "POST",
            "memory_grid_rounds",
            json_payload={
                "session_id": request.session_id,
                "round_number": request.round_number,
                "score": merged_score,
                "correct_targets": merged_correct,
                "wrong_attempts": merged_wrong,
                "total_selections": merged_selections,
                "remaining_hearts": merged_hearts,
                "duration_ms": merged_duration,
                "completed": merged_completed,
                "grid_rows": request.grid_rows,
                "grid_cols": request.grid_cols,
                "memorize_seconds": request.memorize_seconds,
                "target_count": request.target_count,
            },
            prefer_return=True,
            prefer_resolution=True,
            params={"on_conflict": "session_id,round_number"},
        )
        saved_round = (rows or [None])[0]
        if not saved_round:
            raise RuntimeError("Supabase did not return the Memory Grid round.")

        rounds = self._fetch_rounds(request.session_id)
        completed_rounds = self._completed_rounds(rounds)
        total_score = sum(int(row.get("score") or 0) for row in rounds)
        next_round = min(5, max(int(session.get("current_round") or 1), completed_rounds + 1))
        hearts_remaining = min(int(session.get("hearts_remaining") or MAX_HEARTS), request.remaining_hearts)
        updated_rows = self._supabase_request(
            "PATCH",
            "memory_grid_sessions",
            params={"id": f"eq.{request.session_id}", "player_id": f"eq.{request.player_id}"},
            json_payload={
                "current_round": next_round,
                "completed_rounds": completed_rounds,
                "total_score": total_score,
                "hearts_remaining": hearts_remaining,
            },
            prefer_return=True,
        )
        updated_session = (updated_rows or [session])[0]
        return {
            "session": self._map_session(updated_session),
            "round_number": request.round_number,
            "score": int(saved_round.get("score") or 0),
            "completed": bool(saved_round.get("completed")),
            "accepted": True,
        }

    def _update_lifelines_sync(self, request: MemoryGridLifelineUpdateRequest) -> dict[str, Any]:
        session = self._fetch_session(request.session_id, request.player_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory Grid session not found.")
        if session.get("status") != "active":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Memory Grid session is already closed.")
        if request.round_number > int(session.get("current_round") or 1):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Round is not unlocked yet.")

        previous_hearts = int(session.get("hearts_remaining") or MAX_HEARTS)
        if request.remaining_hearts > previous_hearts:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lifelines cannot increase during a session.")

        self._supabase_request(
            "POST",
            "memory_grid_lifeline_events",
            json_payload={
                "session_id": request.session_id,
                "round_number": request.round_number,
                "previous_hearts": previous_hearts,
                "remaining_hearts": request.remaining_hearts,
                "wrong_attempts": request.wrong_attempts,
                "reason": request.reason,
            },
        )
        updated_rows = self._supabase_request(
            "PATCH",
            "memory_grid_sessions",
            params={"id": f"eq.{request.session_id}", "player_id": f"eq.{request.player_id}"},
            json_payload={"hearts_remaining": request.remaining_hearts},
            prefer_return=True,
        )
        updated_session = (updated_rows or [session])[0]
        return {"session": self._map_session(updated_session), "accepted": True}

    def _complete_game_sync(self, request: MemoryGridCompleteRequest) -> dict[str, Any]:
        session = self._fetch_session(request.session_id, request.player_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory Grid session not found.")

        rounds = self._fetch_rounds(request.session_id)
        completed_rounds = self._completed_rounds(rounds)
        total_score = sum(int(row.get("score") or 0) for row in rounds)
        server_accuracy = self._accuracy_for(rounds)
        medal = self._medal_for(completed_rounds)

        if request.result == "active":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completion result cannot be active.")
        if request.result == "victory" and completed_rounds < 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Victory requires all rounds to be complete.")
        if request.remaining_hearts > int(session.get("hearts_remaining") or MAX_HEARTS):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reported hearts failed validation.")
        if request.reported_total_score and abs(request.reported_total_score - total_score) > 12:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reported score failed validation.")
        if request.total_accuracy and abs(request.total_accuracy - server_accuracy) > 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reported accuracy failed validation.")

        updated_rows = self._supabase_request(
            "PATCH",
            "memory_grid_sessions",
            params={"id": f"eq.{request.session_id}", "player_id": f"eq.{request.player_id}"},
            json_payload={
                "status": "completed",
                "completed_rounds": completed_rounds,
                "total_score": total_score,
                "hearts_remaining": request.remaining_hearts,
                "total_accuracy": server_accuracy,
                "completion_time_ms": request.completion_time_ms,
                "result": request.result,
                "medal": medal,
                "completed_at": datetime.now(UTC).isoformat(),
            },
            prefer_return=True,
        )
        updated_session = (updated_rows or [session])[0]

        leaderboard_saved = False
        if completed_rounds >= 1:
            self._supabase_request(
                "POST",
                "memory_grid_leaderboard",
                json_payload={
                    "session_id": request.session_id,
                    "player_id": request.player_id,
                    "player_name": updated_session.get("player_name") or "Player",
                    "total_score": total_score,
                    "completed_rounds": completed_rounds,
                    "hearts_remaining": request.remaining_hearts,
                    "total_accuracy": server_accuracy,
                    "completion_time_ms": request.completion_time_ms,
                    "medal": medal,
                },
                prefer_return=True,
                prefer_resolution=True,
                params={"on_conflict": "session_id"},
            )
            leaderboard_saved = True

        return {
            "session": self._map_session(updated_session),
            "medal": medal,
            "leaderboard_saved": leaderboard_saved,
        }

    def _list_leaderboard_sync(self, limit: int) -> list[dict[str, Any]]:
        rows = self._supabase_request(
            "GET",
            "memory_grid_leaderboard",
            params={
                "select": (
                    "session_id,player_id,player_name,total_score,completed_rounds,hearts_remaining,"
                    "total_accuracy,completion_time_ms,medal,created_at"
                ),
                "order": "total_score.desc,completed_rounds.desc,total_accuracy.desc,created_at.desc",
                "limit": str(max(1, min(limit, 100))),
            },
        )
        return [self._map_leaderboard(row) for row in rows]

    def _validate_round_payload(self, request: MemoryGridRoundProgressRequest) -> None:
        config = ROUND_CONFIGS[request.round_number]
        if (
            request.grid_rows != config["rows"]
            or request.grid_cols != config["cols"]
            or request.memorize_seconds != config["memorize_seconds"]
            or request.target_count != config["target_count"]
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round grid configuration is invalid.")

        if request.correct_targets > request.target_count:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round target count is invalid.")
        if request.completed and request.correct_targets != request.target_count:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed round target count is invalid.")
        if request.total_selections < request.correct_targets:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round selection count is invalid.")
        if request.wrong_attempts > MAX_HEARTS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round lifeline usage is invalid.")
        if request.remaining_hearts + request.wrong_attempts > MAX_HEARTS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Remaining hearts failed validation.")

        max_pick_score = 120 + request.round_number * 18 + config["find_seconds"] * 3 + 5 * 12
        max_score = max_pick_score * request.correct_targets
        if request.score > max_score:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round score is not possible.")
        if request.completed and request.score < request.target_count * 90:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round score failed validation.")

        allowed_duration = (config["memorize_seconds"] + config["find_seconds"]) * 1000 + 300_000
        if request.duration_ms > allowed_duration:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round duration exceeded the allowed window.")
        if request.completed and request.duration_ms < 600:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round duration is not possible.")

    def _fetch_session(self, session_id: str, player_id: str) -> dict[str, Any] | None:
        rows = self._supabase_request(
            "GET",
            "memory_grid_sessions",
            params={
                "select": (
                    "id,player_id,player_name,status,current_round,completed_rounds,total_score,hearts_remaining,"
                    "total_accuracy,completion_time_ms,result,medal,created_at,updated_at"
                ),
                "id": f"eq.{session_id}",
                "player_id": f"eq.{player_id}",
                "limit": "1",
            },
        )
        return (rows or [None])[0]

    def _fetch_round(self, session_id: str, round_number: int) -> dict[str, Any] | None:
        rows = self._supabase_request(
            "GET",
            "memory_grid_rounds",
            params={
                "select": (
                    "id,session_id,round_number,score,correct_targets,wrong_attempts,total_selections,"
                    "remaining_hearts,duration_ms,completed,grid_rows,grid_cols,memorize_seconds,target_count,created_at"
                ),
                "session_id": f"eq.{session_id}",
                "round_number": f"eq.{round_number}",
                "limit": "1",
            },
        )
        return (rows or [None])[0]

    def _fetch_rounds(self, session_id: str) -> list[dict[str, Any]]:
        return self._supabase_request(
            "GET",
            "memory_grid_rounds",
            params={
                "select": (
                    "id,session_id,round_number,score,correct_targets,wrong_attempts,total_selections,"
                    "remaining_hearts,duration_ms,completed,grid_rows,grid_cols,memorize_seconds,target_count,created_at"
                ),
                "session_id": f"eq.{session_id}",
                "order": "round_number.asc",
            },
        )

    def _supabase_request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json_payload: Any | None = None,
        prefer_return: bool = False,
        prefer_resolution: bool = False,
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
        prefer_values: list[str] = []
        if prefer_return:
            prefer_values.append("return=representation")
        if prefer_resolution:
            prefer_values.append("resolution=merge-duplicates")
        if prefer_values:
            headers["Prefer"] = ",".join(prefer_values)

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
    def _completed_rounds(rounds: list[dict[str, Any]]) -> int:
        completed = 0
        by_round = {int(row.get("round_number") or 0): row for row in rounds}
        for round_number in range(1, 6):
            row = by_round.get(round_number)
            target_count = ROUND_CONFIGS[round_number]["target_count"]
            if not row or not row.get("completed") or int(row.get("correct_targets") or 0) < target_count:
                break
            completed = round_number
        return completed

    @staticmethod
    def _accuracy_for(rounds: list[dict[str, Any]]) -> float:
        correct = sum(int(row.get("correct_targets") or 0) for row in rounds)
        wrong = sum(int(row.get("wrong_attempts") or 0) for row in rounds)
        total = correct + wrong
        if total <= 0:
            return 100.0
        return round((correct / total) * 100, 1)

    @staticmethod
    def _medal_for(completed_rounds: int) -> MemoryGridMedal:
        if completed_rounds >= 5:
            return "gold"
        if completed_rounds == 4:
            return "silver"
        if completed_rounds == 3:
            return "bronze"
        return "none"

    @staticmethod
    def _map_session(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "session_id": row["id"],
            "player_id": row.get("player_id") or "",
            "player_name": row.get("player_name") or "Player",
            "status": row.get("status") or "active",
            "current_round": row.get("current_round") or 1,
            "completed_rounds": row.get("completed_rounds") or 0,
            "total_score": row.get("total_score") or 0,
            "hearts_remaining": row.get("hearts_remaining") or 0,
            "total_accuracy": float(row.get("total_accuracy") or 0),
            "completion_time_ms": row.get("completion_time_ms") or 0,
            "result": row.get("result") or "active",
            "medal": row.get("medal"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at") or row.get("created_at"),
        }

    @staticmethod
    def _map_leaderboard(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "session_id": row.get("session_id") or "",
            "player_id": row.get("player_id") or "",
            "player_name": row.get("player_name") or "Player",
            "total_score": row.get("total_score") or 0,
            "completed_rounds": row.get("completed_rounds") or 0,
            "hearts_remaining": row.get("hearts_remaining") or 0,
            "total_accuracy": float(row.get("total_accuracy") or 0),
            "completion_time_ms": row.get("completion_time_ms") or 0,
            "medal": row.get("medal") or "none",
            "created_at": row.get("created_at"),
        }

    @staticmethod
    def _safe_error(exc: Exception) -> str:
        raw_message = str(exc).strip() or exc.__class__.__name__
        redacted = raw_message.replace("\n", " ")
        for marker in ("eyJ", "Bearer "):
            if marker in redacted:
                redacted = redacted.split(marker)[0].strip() or "Supabase rejected the request."
        return redacted[:700]


memory_grid_service = MemoryGridService()
