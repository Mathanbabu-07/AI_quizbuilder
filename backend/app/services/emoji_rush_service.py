from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.models.emoji_rush import (
    EmojiRushCompleteRequest,
    EmojiRushMedal,
    EmojiRushRoundProgressRequest,
    EmojiRushStartRequest,
)

logger = logging.getLogger("genquiz.emoji_rush")

ROUND_CONFIGS: dict[int, dict[str, int]] = {
    1: {"board_size": 7, "emoji_variety": 5, "target_points": 14, "time_limit_ms": 90_000},
    2: {"board_size": 7, "emoji_variety": 6, "target_points": 14, "time_limit_ms": 84_000},
    3: {"board_size": 8, "emoji_variety": 6, "target_points": 14, "time_limit_ms": 78_000},
    4: {"board_size": 9, "emoji_variety": 7, "target_points": 18, "time_limit_ms": 72_000},
    5: {"board_size": 9, "emoji_variety": 8, "target_points": 25, "time_limit_ms": 66_000},
}


class EmojiRushService:
    async def start_game(self, request: EmojiRushStartRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._start_game_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("emoji rush start failed player_id=%s", request.player_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Emoji Rush game could not be started. {self._safe_error(exc)}",
            ) from exc

    async def save_round_progress(self, request: EmojiRushRoundProgressRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._save_round_progress_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception(
                "emoji rush round save failed session_id=%s round=%s",
                request.session_id,
                request.round_number,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Emoji Rush round progress could not be saved. {self._safe_error(exc)}",
            ) from exc

    async def complete_game(self, request: EmojiRushCompleteRequest) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._complete_game_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("emoji rush completion failed session_id=%s", request.session_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Emoji Rush game could not be completed. {self._safe_error(exc)}",
            ) from exc

    async def list_leaderboard(self, limit: int = 25) -> list[dict[str, Any]]:
        try:
            return await run_in_threadpool(self._list_leaderboard_sync, limit)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("emoji rush leaderboard load failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Emoji Rush leaderboard could not be loaded. {self._safe_error(exc)}",
            ) from exc

    def _start_game_sync(self, request: EmojiRushStartRequest) -> dict[str, Any]:
        rows = self._supabase_request(
            "POST",
            "emoji_rush_sessions",
            json_payload={
                "player_id": request.player_id,
                "player_name": request.player_name,
                "status": "active",
                "current_round": 1,
                "completed_rounds": 0,
                "total_score": 0,
                "medal": None,
            },
            prefer_return=True,
        )
        saved = (rows or [None])[0]
        if not saved:
            raise RuntimeError("Supabase did not return the Emoji Rush session.")
        return self._map_session(saved)

    def _save_round_progress_sync(self, request: EmojiRushRoundProgressRequest) -> dict[str, Any]:
        session = self._fetch_session(request.session_id, request.player_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emoji Rush session not found.")
        if session.get("status") != "active":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Emoji Rush session is already closed.")
        if request.round_number > int(session.get("current_round") or 1):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Round is not unlocked yet.")

        self._validate_round_payload(request)

        existing = self._fetch_round(request.session_id, request.round_number)
        merged_points = max(request.points, int((existing or {}).get("points") or 0))
        merged_match3 = max(request.match3_count, int((existing or {}).get("match3_count") or 0))
        merged_match5 = max(request.match5_count, int((existing or {}).get("match5_count") or 0))
        merged_combo = max(request.max_combo, int((existing or {}).get("max_combo") or 0))
        merged_moves = max(request.moves, int((existing or {}).get("moves") or 0))
        merged_duration = max(request.duration_ms, int((existing or {}).get("duration_ms") or 0))
        merged_completed = bool(request.completed or (existing or {}).get("completed"))

        rows = self._supabase_request(
            "POST",
            "emoji_rush_rounds",
            json_payload={
                "session_id": request.session_id,
                "round_number": request.round_number,
                "points": merged_points,
                "match3_count": merged_match3,
                "match5_count": merged_match5,
                "max_combo": merged_combo,
                "moves": merged_moves,
                "duration_ms": merged_duration,
                "completed": merged_completed,
                "board_size": request.board_size,
                "emoji_variety": request.emoji_variety,
            },
            prefer_return=True,
            prefer_resolution=True,
            params={"on_conflict": "session_id,round_number"},
        )
        saved_round = (rows or [None])[0]
        if not saved_round:
            raise RuntimeError("Supabase did not return the Emoji Rush round.")

        rounds = self._fetch_rounds(request.session_id)
        completed_rounds = self._completed_rounds(rounds)
        total_score = sum(int(row.get("points") or 0) for row in rounds)
        next_round = min(5, max(int(session.get("current_round") or 1), completed_rounds + 1))
        updated_rows = self._supabase_request(
            "PATCH",
            "emoji_rush_sessions",
            params={"id": f"eq.{request.session_id}", "player_id": f"eq.{request.player_id}"},
            json_payload={
                "current_round": next_round,
                "completed_rounds": completed_rounds,
                "total_score": total_score,
            },
            prefer_return=True,
        )
        updated_session = (updated_rows or [session])[0]
        return {
            "session": self._map_session(updated_session),
            "round_number": request.round_number,
            "points": int(saved_round.get("points") or 0),
            "completed": bool(saved_round.get("completed")),
            "accepted": True,
        }

    def _complete_game_sync(self, request: EmojiRushCompleteRequest) -> dict[str, Any]:
        session = self._fetch_session(request.session_id, request.player_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emoji Rush session not found.")

        rounds = self._fetch_rounds(request.session_id)
        completed_rounds = self._completed_rounds(rounds)
        total_score = sum(int(row.get("points") or 0) for row in rounds)
        medal = self._medal_for(completed_rounds)
        best_combo = max([int(row.get("max_combo") or 0) for row in rounds] or [0])

        if request.reported_total_score and abs(request.reported_total_score - total_score) > 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reported score failed validation.")

        updated_rows = self._supabase_request(
            "PATCH",
            "emoji_rush_sessions",
            params={"id": f"eq.{request.session_id}", "player_id": f"eq.{request.player_id}"},
            json_payload={
                "status": "completed",
                "completed_rounds": completed_rounds,
                "total_score": total_score,
                "medal": medal,
                "completed_at": datetime.now(UTC).isoformat(),
            },
            prefer_return=True,
        )
        updated_session = (updated_rows or [session])[0]

        leaderboard_saved = False
        if completed_rounds >= 1:
            player_name = updated_session.get("player_name") or "Player"
            self._supabase_request(
                "POST",
                "emoji_rush_leaderboard",
                json_payload={
                    "session_id": request.session_id,
                    "player_id": request.player_id,
                    "player_name": player_name,
                    "total_score": total_score,
                    "completed_rounds": completed_rounds,
                    "medal": medal,
                    "best_combo": best_combo,
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
            "emoji_rush_leaderboard",
            params={
                "select": "session_id,player_id,player_name,total_score,completed_rounds,medal,best_combo,created_at",
                "order": "total_score.desc,completed_rounds.desc,created_at.desc",
                "limit": str(max(1, min(limit, 100))),
            },
        )
        return [self._map_leaderboard(row) for row in rows]

    def _validate_round_payload(self, request: EmojiRushRoundProgressRequest) -> None:
        config = ROUND_CONFIGS[request.round_number]
        if request.board_size != config["board_size"] or request.emoji_variety != config["emoji_variety"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round board configuration is invalid.")

        expected_points = request.match3_count * 2 + request.match5_count * 3
        if request.points != expected_points:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round score failed validation.")
        if request.completed and request.points < config["target_points"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round target was not reached.")
        if request.match5_count > request.match3_count + request.match5_count:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round combo counts are invalid.")
        if request.max_combo > request.match3_count + request.match5_count:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round combo chain is invalid.")
        if request.moves == 0 and request.points > 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round move count is invalid.")
        if request.points > max(36, request.moves * 18):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round score is not possible.")
        if request.duration_ms > config["time_limit_ms"] + 300_000:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round duration exceeded the allowed window.")
        if request.completed and request.duration_ms < 600:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round duration is not possible.")

    def _fetch_session(self, session_id: str, player_id: str) -> dict[str, Any] | None:
        rows = self._supabase_request(
            "GET",
            "emoji_rush_sessions",
            params={
                "select": (
                    "id,player_id,player_name,status,current_round,completed_rounds,total_score,"
                    "medal,created_at,updated_at"
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
            "emoji_rush_rounds",
            params={
                "select": (
                    "id,session_id,round_number,points,match3_count,match5_count,max_combo,"
                    "moves,duration_ms,completed,board_size,emoji_variety,created_at"
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
            "emoji_rush_rounds",
            params={
                "select": (
                    "id,session_id,round_number,points,match3_count,match5_count,max_combo,"
                    "moves,duration_ms,completed,board_size,emoji_variety,created_at"
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
            target_points = ROUND_CONFIGS[round_number]["target_points"]
            if not row or not row.get("completed") or int(row.get("points") or 0) < target_points:
                break
            completed = round_number
        return completed

    @staticmethod
    def _medal_for(completed_rounds: int) -> EmojiRushMedal:
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
            "medal": row.get("medal") or "none",
            "best_combo": row.get("best_combo") or 0,
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


emoji_rush_service = EmojiRushService()
