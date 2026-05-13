import asyncio
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any

from app.models.multiplayer import ParticipantRole, ParticipantState, RoomState, RoomStatus


class RoomError(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


@dataclass
class ParticipantRecord:
    sid: str
    name: str
    role: ParticipantRole
    joined_at: float
    completed: bool = False
    score: int | None = None
    accuracy: int | None = None
    average_response_time: int | None = None


@dataclass
class RoomRecord:
    code: str
    host_sid: str
    created_at: float
    status: RoomStatus = "waiting"
    participants: "OrderedDict[str, ParticipantRecord]" = field(default_factory=OrderedDict)
    started_at: float | None = None
    quiz: dict[str, Any] | None = None
    settings: dict[str, Any] | None = None


class RoomService:
    def __init__(self) -> None:
        self._rooms: dict[str, RoomRecord] = {}
        self._sid_to_room: dict[str, str] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def normalize_code(code: str | None) -> str:
        return "".join((code or "").upper().split())

    async def create_room(
        self,
        room_code: str | None,
        host_sid: str,
        quiz: dict[str, Any] | None = None,
        settings: dict[str, Any] | None = None,
    ) -> RoomState:
        code = self.normalize_code(room_code)
        if len(code) < 4 or len(code) > 10:
            raise RoomError("Invalid arena code.")

        async with self._lock:
            await self._remove_sid_unlocked(host_sid)

            if code in self._rooms:
                raise RoomError("Arena code is already active.")

            room = RoomRecord(
                code=code,
                host_sid=host_sid,
                created_at=time.time(),
                quiz=quiz,
                settings=settings,
            )
            room.participants[host_sid] = ParticipantRecord(
                sid=host_sid,
                name="Host",
                role="host",
                joined_at=room.created_at,
            )
            self._rooms[code] = room
            self._sid_to_room[host_sid] = code

            return self._snapshot(room)

    async def close_room(self, host_sid: str, room_code: str | None = None) -> str | None:
        code = self.normalize_code(room_code) or self._sid_to_room.get(host_sid)
        if not code:
            return None

        async with self._lock:
            room = self._rooms.get(code)
            if not room or room.host_sid != host_sid:
                return None

            for sid in list(room.participants):
                self._sid_to_room.pop(sid, None)
            self._rooms.pop(code, None)
            return code

    async def join_room(self, room_code: str | None, sid: str) -> tuple[str, RoomState]:
        code = self.normalize_code(room_code)

        async with self._lock:
            room = self._rooms.get(code)
            if not room:
                raise RoomError("Room not found.")
            if room.status != "waiting":
                raise RoomError("Quiz arena unavailable.")

            await self._remove_sid_unlocked(sid)

            player_index = sum(1 for participant in room.participants.values() if participant.role == "participant") + 1
            participant = ParticipantRecord(
                sid=sid,
                name=f"Player {player_index}",
                role="participant",
                joined_at=time.time(),
            )
            room.participants[sid] = participant
            self._sid_to_room[sid] = code

            return sid, self._snapshot(room)

    async def update_name(self, sid: str, name: str | None) -> RoomState:
        cleaned_name = " ".join((name or "").strip().split())[:24]
        if len(cleaned_name) < 2:
            raise RoomError("Name must be at least 2 characters.")

        async with self._lock:
            code = self._sid_to_room.get(sid)
            if not code or code not in self._rooms:
                raise RoomError("Room not found.")

            room = self._rooms[code]
            participant = room.participants.get(sid)
            if not participant:
                raise RoomError("Participant not found.")

            participant.name = cleaned_name
            return self._snapshot(room)

    async def start_room(
        self,
        sid: str,
        room_code: str | None = None,
        quiz: dict[str, Any] | None = None,
        settings: dict[str, Any] | None = None,
    ) -> RoomState:
        code = self.normalize_code(room_code) or self._sid_to_room.get(sid)

        async with self._lock:
            room = self._rooms.get(code or "")
            if not room or room.host_sid != sid:
                raise RoomError("Only the host can start this arena.")

            room.status = "started"
            room.started_at = time.time()
            room.quiz = quiz or room.quiz
            room.settings = settings or room.settings

            for participant in room.participants.values():
                participant.completed = False
                participant.score = None
                participant.accuracy = None
                participant.average_response_time = None

            return self._snapshot(room)

    async def submit_result(
        self,
        sid: str,
        score: int | None,
        accuracy: int | None,
        average_response_time: int | None,
    ) -> RoomState:
        async with self._lock:
            code = self._sid_to_room.get(sid)
            if not code or code not in self._rooms:
                raise RoomError("Room not found.")

            room = self._rooms[code]
            participant = room.participants.get(sid)
            if not participant:
                raise RoomError("Participant not found.")

            participant.completed = True
            participant.score = max(0, int(score or 0))
            participant.accuracy = max(0, min(100, int(accuracy or 0)))
            participant.average_response_time = max(0, int(average_response_time or 0))

            if self._all_players_finished(room):
                room.status = "finished"

            return self._snapshot(room)

    async def remove_sid(self, sid: str) -> tuple[str | None, bool, RoomState | None]:
        async with self._lock:
            return await self._remove_sid_unlocked(sid)

    async def _remove_sid_unlocked(self, sid: str) -> tuple[str | None, bool, RoomState | None]:
        code = self._sid_to_room.pop(sid, None)
        if not code:
            return None, False, None

        room = self._rooms.get(code)
        if not room:
            return code, False, None

        was_host = room.host_sid == sid
        if was_host:
            for participant_sid in list(room.participants):
                self._sid_to_room.pop(participant_sid, None)
            self._rooms.pop(code, None)
            return code, True, None

        room.participants.pop(sid, None)
        if len(room.participants) <= 1 and room.host_sid not in room.participants:
            self._rooms.pop(code, None)
            return code, False, None

        return code, False, self._snapshot(room)

    @staticmethod
    def _snapshot(room: RoomRecord) -> RoomState:
        participant_states = [
            ParticipantState(
                id=participant.sid,
                name=participant.name,
                role=participant.role,
                is_host=participant.role == "host",
                joined_at=participant.joined_at,
                completed=participant.completed,
                score=participant.score,
                accuracy=participant.accuracy,
                average_response_time=participant.average_response_time,
            )
            for participant in room.participants.values()
            if participant.role == "participant"
        ]
        leaderboard_source = [
            ParticipantState(
                id=participant.sid,
                name=participant.name,
                role=participant.role,
                is_host=participant.role == "host",
                joined_at=participant.joined_at,
                completed=participant.completed,
                score=participant.score,
                accuracy=participant.accuracy,
                average_response_time=participant.average_response_time,
            )
            for participant in room.participants.values()
        ]
        leaderboard = sorted(
            [participant for participant in leaderboard_source if participant.completed],
            key=lambda participant: (
                -(participant.score or 0),
                -(participant.accuracy or 0),
                participant.average_response_time or 9999,
                participant.joined_at,
            ),
        )

        return RoomState(
            code=room.code,
            status=room.status,
            host_id=room.host_sid,
            participants=participant_states,
            participant_count=len(participant_states),
            created_at=room.created_at,
            started_at=room.started_at,
            quiz=room.quiz,
            settings=room.settings,
            leaderboard=leaderboard,
            all_finished=room.status == "finished",
        )

    @staticmethod
    def _all_players_finished(room: RoomRecord) -> bool:
        participants = list(room.participants.values())
        return bool(participants) and all(participant.completed for participant in participants)


room_service = RoomService()
