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
    openrouter_model: str = "openai/gpt-oss-120b:free"
    openrouter_file_model: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    openrouter_url_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    scrapedo_api_token: str = ""
    scrapedo_base_url: str = "http://api.scrape.do/"
    frontend_url: str = ""
    frontend_urls: list[str] = []
    cors_allow_origin_regex: str = (
        r"^https://[a-z0-9-]+\.vercel\.app$|"
        r"^http://localhost(:[0-9]+)?$|"
        r"^http://127\.0\.0\.1(:[0-9]+)?$"
    )
    generation_timeout_seconds: float = 120.0
    max_upload_mb: int = 10
    max_url_content_length: int = 50_000
    supabase_url: str = ""
    supabase_anon_key: str = ""
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


def _secret_env_any(*names: str) -> str:
    for name in names:
        value = _secret_env(name)
        if value:
            return value
    return ""


def _text_env(name: str, default: str) -> str:
    value = os.getenv(name, "").strip()
    return value or default


def _openrouter_model_env(name: str, default: str) -> str:
    value = _text_env(name, default)
    if value == "nemotron-3-super-120b-a12b:free":
        return "nvidia/nemotron-3-super-120b-a12b:free"
    return value


def _text_env_any(names: tuple[str, ...], default: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


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
        openrouter_model=_openrouter_model_env("OPENROUTER_MODEL", "openai/gpt-oss-120b:free"),
        openrouter_file_model=_text_env_any(
            ("OPENROUTER_PDF_MODEL", "OPENROUTER_FILE_MODEL"),
            "nvidia/nemotron-3-nano-30b-a3b:free",
        ),
        openrouter_url_model=_openrouter_model_env(
            "OPENROUTER_URL_MODEL",
            "nvidia/nemotron-3-super-120b-a12b:free",
        ),
        scrapedo_api_token=_secret_env_any("SCRAPEDO_API_KEY", "SCRAPEDO_API_TOKEN"),
        scrapedo_base_url=os.getenv("SCRAPEDO_BASE_URL", "http://api.scrape.do/").strip(),
        frontend_url=frontend_url,
        frontend_urls=frontend_urls,
        cors_allow_origin_regex=os.getenv(
            "CORS_ALLOW_ORIGIN_REGEX",
            Settings.model_fields["cors_allow_origin_regex"].default,
        ),
        generation_timeout_seconds=_float_env("GENERATION_TIMEOUT_SECONDS", 120.0),
        max_upload_mb=max(1, int(_float_env("PDF_MAX_UPLOAD_MB", _float_env("MAX_UPLOAD_MB", 10)))),
        max_url_content_length=max(4_000, int(_float_env("MAX_URL_CONTENT_LENGTH", 50_000))),
        supabase_url=_secret_env("SUPABASE_URL").rstrip("/"),
        supabase_anon_key=_secret_env("SUPABASE_ANON_KEY"),
        supabase_service_role_key=_secret_env("SUPABASE_SERVICE_ROLE_KEY"),
    )
