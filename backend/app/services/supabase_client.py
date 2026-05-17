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
    key_payload = _decode_jwt_payload(settings.supabase_service_role_key)
    key_role = _payload_value(key_payload, "role")
    key_ref = _payload_value(key_payload, "ref")
    parsed_url = urlparse(settings.supabase_url) if settings.supabase_url else None
    url_host = parsed_url.netloc if parsed_url else ""
    url_ref = url_host.split(".")[0] if url_host else ""
    key_matches_url = bool(key_ref and url_ref and key_ref == url_ref)

    return {
        "url_configured": bool(settings.supabase_url),
        "key_configured": bool(settings.supabase_service_role_key),
        "url_host": url_host,
        "url_ref": url_ref,
        "key_role": key_role,
        "key_ref": key_ref,
        "key_matches_url": key_matches_url,
        "ready": bool(
            settings.supabase_url
            and settings.supabase_service_role_key
            and key_role == "service_role"
            and key_matches_url
        ),
    }


def _decode_jwt_payload(token: str) -> dict[str, object]:
    if not token or token.count(".") < 2:
        return {}

    try:
        payload_part = token.split(".")[1]
        padded = payload_part + "=" * (-len(payload_part) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))
        return decoded if isinstance(decoded, dict) else {}
    except Exception:
        return {}


def _payload_value(payload: dict[str, object], key: str) -> str:
    value = payload.get(key)
    return value if isinstance(value, str) else "unknown"
