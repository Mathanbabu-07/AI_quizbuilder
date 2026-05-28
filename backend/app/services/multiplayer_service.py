import random
import string

from app.services.supabase_service import supabase_service


def generate_room_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def create_persistent_room(*, quiz_id: str | None, host_name: str) -> tuple[str, str | None]:
    for _ in range(5):
        room_code = generate_room_code()
        room_id = supabase_service.create_multiplayer_room(
            room_code=room_code,
            quiz_id=quiz_id,
            host_name=host_name,
        )
        if room_id:
            return room_code, room_id

    room_code = generate_room_code()
    return room_code, None


async def create_persistent_room_async(*, quiz_id: str | None, host_name: str) -> tuple[str, str | None]:
    for _ in range(5):
        room_code = generate_room_code()
        room_id = await supabase_service.create_multiplayer_room_async(
            room_code=room_code,
            quiz_id=quiz_id,
            host_name=host_name,
        )
        if room_id:
            return room_code, room_id

    room_code = generate_room_code()
    return room_code, None
