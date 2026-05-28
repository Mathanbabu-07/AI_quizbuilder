import logging
import asyncio
from dataclasses import dataclass
from typing import Any

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger("genquiz.supabase_service")


@dataclass
class SupabaseService:
    async def save_generated_quiz_async(
        self,
        *,
        title: str,
        quiz_data: dict[str, Any],
        mode: str,
        host_id: str | None,
        source_type: str | None = None,
        source_url: str | None = None,
    ) -> str | None:
        return await asyncio.to_thread(
            self.save_generated_quiz,
            title=title,
            quiz_data=quiz_data,
            mode=mode,
            host_id=host_id,
            source_type=source_type,
            source_url=source_url,
        )

    def save_generated_quiz(
        self,
        *,
        title: str,
        quiz_data: dict[str, Any],
        mode: str,
        host_id: str | None,
        source_type: str | None = None,
        source_url: str | None = None,
    ) -> str | None:
        if not quiz_data.get("questions"):
            raise ValueError("Cannot save an empty quiz.")

        try:
            row_payload: dict[str, Any] = {
                "title": title,
                "quiz_data": quiz_data,
                "mode": mode,
                "host_id": host_id,
            }
            if source_type:
                row_payload["source_type"] = source_type
            if source_url:
                row_payload["source_url"] = source_url

            response = (
                get_supabase_client()
                .table("generated_quizzes")
                .insert(row_payload)
                .execute()
            )
            row = response.data[0] if response.data else None
            return str(row["id"]) if row and row.get("id") else None
        except Exception as exc:
            logger.warning("Generated quiz was not persisted: %s", exc)
            return None

    def create_multiplayer_room(self, *, room_code: str, quiz_id: str | None, host_name: str) -> str | None:
        try:
            response = (
                get_supabase_client()
                .table("multiplayer_rooms")
                .insert(
                    {
                        "room_code": room_code,
                        "quiz_id": quiz_id,
                        "host_name": host_name,
                        "status": "waiting",
                    }
                )
                .execute()
            )
            row = response.data[0] if response.data else None
            return str(row["id"]) if row and row.get("id") else None
        except Exception as exc:
            logger.warning("Multiplayer room was not persisted: %s", exc)
            return None

    async def create_multiplayer_room_async(self, *, room_code: str, quiz_id: str | None, host_name: str) -> str | None:
        return await asyncio.to_thread(
            self.create_multiplayer_room,
            room_code=room_code,
            quiz_id=quiz_id,
            host_name=host_name,
        )

    def add_room_player(self, *, room_id: str, player_name: str) -> str | None:
        try:
            response = (
                get_supabase_client()
                .table("room_players")
                .insert({"room_id": room_id, "player_name": player_name, "score": 0})
                .execute()
            )
            row = response.data[0] if response.data else None
            return str(row["id"]) if row and row.get("id") else None
        except Exception as exc:
            logger.warning("Room player was not persisted: %s", exc)
            return None

    async def add_room_player_async(self, *, room_id: str, player_name: str) -> str | None:
        return await asyncio.to_thread(self.add_room_player, room_id=room_id, player_name=player_name)


supabase_service = SupabaseService()
