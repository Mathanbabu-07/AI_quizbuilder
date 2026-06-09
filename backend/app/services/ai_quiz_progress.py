import time
from dataclasses import asdict, dataclass
from threading import Lock
from typing import Literal

ProgressStatus = Literal["pending", "running", "complete", "error"]

_PROGRESS_TTL_SECONDS = 10 * 60
_MAX_PROGRESS_ITEMS = 128
_progress_lock = Lock()
_progress_by_id: dict[str, "AIQuizProgressSnapshot"] = {}


@dataclass
class AIQuizProgressSnapshot:
    progress_id: str
    progress: int
    stage: str
    status: ProgressStatus
    updated_at: float


def start_ai_quiz_progress(progress_id: str | None) -> None:
    if not progress_id:
        return
    _set_progress(progress_id, 0, "Request received", "running")


def update_ai_quiz_progress(progress_id: str | None, progress: int, stage: str) -> None:
    if not progress_id:
        return
    _set_progress(progress_id, progress, stage, "running")


def complete_ai_quiz_progress(progress_id: str | None) -> None:
    if not progress_id:
        return
    _set_progress(progress_id, 100, "Quiz ready", "complete")


def fail_ai_quiz_progress(progress_id: str | None, stage: str = "Generation failed") -> None:
    if not progress_id:
        return

    with _progress_lock:
        _prune_progress_locked()
        current = _progress_by_id.get(progress_id)
        progress = current.progress if current else 0
        _progress_by_id[progress_id] = AIQuizProgressSnapshot(
            progress_id=progress_id,
            progress=progress,
            stage=stage,
            status="error",
            updated_at=time.time(),
        )


def get_ai_quiz_progress(progress_id: str) -> dict[str, int | str]:
    with _progress_lock:
        _prune_progress_locked()
        current = _progress_by_id.get(progress_id)
        if current:
            payload = asdict(current)
        else:
            payload = asdict(
                AIQuizProgressSnapshot(
                    progress_id=progress_id,
                    progress=0,
                    stage="Waiting for request",
                    status="pending",
                    updated_at=time.time(),
                )
            )
        payload.pop("updated_at", None)
        return payload


def _set_progress(progress_id: str, progress: int, stage: str, status: ProgressStatus) -> None:
    bounded_progress = max(0, min(100, progress))

    with _progress_lock:
        _prune_progress_locked()
        current = _progress_by_id.get(progress_id)
        if current:
            bounded_progress = max(current.progress, bounded_progress)

        _progress_by_id[progress_id] = AIQuizProgressSnapshot(
            progress_id=progress_id,
            progress=bounded_progress,
            stage=stage,
            status=status,
            updated_at=time.time(),
        )

        if len(_progress_by_id) <= _MAX_PROGRESS_ITEMS:
            return

        oldest_id = min(_progress_by_id, key=lambda item: _progress_by_id[item].updated_at)
        _progress_by_id.pop(oldest_id, None)


def _prune_progress_locked() -> None:
    expires_before = time.time() - _PROGRESS_TTL_SECONDS
    expired_ids = [
        progress_id
        for progress_id, snapshot in _progress_by_id.items()
        if snapshot.updated_at < expires_before
    ]
    for progress_id in expired_ids:
        _progress_by_id.pop(progress_id, None)
