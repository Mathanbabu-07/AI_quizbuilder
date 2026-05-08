from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseModel):
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-oss-120b:free"
    frontend_origin: str = "http://localhost:3001"
    app_name: str = "GENQUIZ API"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_model=os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free"),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:3001"),
    )
