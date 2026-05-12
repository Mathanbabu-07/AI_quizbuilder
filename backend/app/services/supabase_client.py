from functools import lru_cache

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
