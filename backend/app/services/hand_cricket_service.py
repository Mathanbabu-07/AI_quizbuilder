from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.models.hand_cricket import HandCricketMatchCreate

logger = logging.getLogger("genquiz.hand_cricket")


class HandCricketService:
    async def save_match(self, request: HandCricketMatchCreate) -> dict[str, Any]:
        try:
            return await run_in_threadpool(self._save_match_sync, request)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("hand cricket match save failed player_name=%s", request.player_name)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Hand Cricket match could not be saved. {self._safe_error(exc)}",
            ) from exc

    async def list_matches(self, limit: int = 20) -> list[dict[str, Any]]:
        try:
            return await run_in_threadpool(self._list_matches_sync, limit)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("hand cricket match list failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Hand Cricket match history could not be loaded. {self._safe_error(exc)}",
            ) from exc

    def _save_match_sync(self, request: HandCricketMatchCreate) -> dict[str, Any]:
        rows = self._supabase_request(
            "POST",
            "hand_cricket_matches",
            json_payload={
                "player_name": " ".join(request.player_name.strip().split()) or "Player",
                "player_score": request.player_score,
                "ai_score": request.ai_score,
                "winner": request.winner,
            },
            prefer_return=True,
        )
        saved = (rows or [None])[0]
        if not saved:
            raise RuntimeError("Supabase did not return the saved Hand Cricket match row.")
        return self._map_match(saved)

    def _list_matches_sync(self, limit: int) -> list[dict[str, Any]]:
        rows = self._supabase_request(
            "GET",
            "hand_cricket_matches",
            params={
                "select": "id,player_name,player_score,ai_score,winner,created_at",
                "order": "created_at.desc",
                "limit": str(max(1, min(limit, 100))),
            },
        )
        return [self._map_match(row) for row in rows]

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
    def _map_match(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "player_name": row.get("player_name") or "Player",
            "player_score": row.get("player_score") or 0,
            "ai_score": row.get("ai_score") or 0,
            "winner": row.get("winner") or "draw",
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


hand_cricket_service = HandCricketService()
