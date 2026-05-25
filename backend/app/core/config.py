from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseModel):
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "qwen/qwen3-next-80b-a3b-instruct:free"
    openrouter_file_model: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    frontend_url: str = ""
    frontend_urls: list[str] = []
    cors_allow_origin_regex: str = (
        r"^https://[a-z0-9-]+\.vercel\.app$|"
        r"^http://localhost(:[0-9]+)?$|"
        r"^http://127\.0\.0\.1(:[0-9]+)?$"
    )
    generation_timeout_seconds: float = 120.0
    max_upload_mb: int = 10
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    app_name: str = "GENQUIZ API"


def _float_env(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if not raw_value:
        return default

    try:
        return float(raw_value)
    except ValueError:
        return default


def _csv_env(name: str) -> list[str]:
    raw_value = os.getenv(name, "")
    return [value.strip().rstrip("/") for value in raw_value.split(",") if value.strip()]


def _secret_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if value.startswith(f"{name}="):
        value = value.split("=", 1)[1].strip()
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        value = value[1:-1].strip()
    value = value.strip().strip('"').strip("'")
    return "".join(value.split())


def _text_env(name: str, default: str) -> str:
    value = os.getenv(name, "").strip()
    return value or default


def _unique_urls(values: list[str]) -> list[str]:
    seen: set[str] = set()
    urls: list[str] = []

    for value in values:
        normalized = value.strip().rstrip("/")
        if normalized and normalized not in seen:
            seen.add(normalized)
            urls.append(normalized)

    return urls


@lru_cache
def get_settings() -> Settings:
    frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    frontend_urls = _unique_urls([frontend_url, *_csv_env("FRONTEND_URLS")])

    return Settings(
        openrouter_api_key=_secret_env("OPENROUTER_API_KEY"),
        openrouter_base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip().rstrip("/"),
        openrouter_model=_text_env("OPENROUTER_MODEL", "qwen/qwen3-next-80b-a3b-instruct:free"),
        openrouter_file_model=_text_env(
            "OPENROUTER_FILE_MODEL",
            "nvidia/nemotron-3-nano-30b-a3b:free",
        ),
        frontend_url=frontend_url,
        frontend_urls=frontend_urls,
        cors_allow_origin_regex=os.getenv(
            "CORS_ALLOW_ORIGIN_REGEX",
            Settings.model_fields["cors_allow_origin_regex"].default,
        ),
        generation_timeout_seconds=_float_env("GENERATION_TIMEOUT_SECONDS", 120.0),
        max_upload_mb=max(1, int(_float_env("MAX_UPLOAD_MB", 10))),
        supabase_url=_secret_env("SUPABASE_URL").rstrip("/"),
        supabase_service_role_key=_secret_env("SUPABASE_SERVICE_ROLE_KEY"),
    )
