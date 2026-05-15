import base64
import json
from functools import lru_cache
from urllib.parse import urlparse

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()

    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL is missing in backend/.env.")

    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env.")

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_diagnostics() -> dict[str, str | bool]:
    settings = get_settings()
    key_role = _decode_jwt_role(settings.supabase_service_role_key)
    parsed_url = urlparse(settings.supabase_url) if settings.supabase_url else None

    return {
        "url_configured": bool(settings.supabase_url),
        "key_configured": bool(settings.supabase_service_role_key),
        "url_host": parsed_url.netloc if parsed_url else "",
        "key_role": key_role,
        "ready": bool(settings.supabase_url and settings.supabase_service_role_key and key_role == "service_role"),
    }


def _decode_jwt_role(token: str) -> str:
    if not token or token.count(".") < 2:
        return "missing"

    try:
        payload_part = token.split(".")[1]
        padded = payload_part + "=" * (-len(payload_part) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))
        role = payload.get("role")
        return role if isinstance(role, str) else "unknown"
    except Exception:
        return "unreadable"
