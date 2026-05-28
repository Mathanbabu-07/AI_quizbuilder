import asyncio
import logging
from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings

logger = logging.getLogger("genquiz.scrape")


@dataclass
class ScrapeDoService:
    settings: Settings

    async def fetch(self, url: str) -> str:
        if not self.settings.scrapedo_api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Scrape.do API key is missing. Add SCRAPEDO_API_KEY in backend/.env and restart the backend.",
            )

        timeout_seconds = min(35.0, max(12.0, self.settings.generation_timeout_seconds / 3))
        last_error: Exception | None = None

        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_seconds, connect=6.0)) as client:
                    response = await client.get(
                        self.settings.scrapedo_base_url,
                        params={"token": self.settings.scrapedo_api_token, "url": url},
                        headers={"Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"},
                    )
                response.raise_for_status()
                if not response.text.strip():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Scrape.do returned an empty page. Try another public URL.",
                    )
                return response.text
            except httpx.TimeoutException as exc:
                last_error = exc
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code in {400, 401, 402, 403, 404}:
                    raise HTTPException(
                        status_code=exc.response.status_code,
                        detail=f"URL extraction failed through Scrape.do with status {exc.response.status_code}.",
                    ) from exc

            if attempt == 0:
                await asyncio.sleep(0.35)

        logger.warning("Scrape.do extraction failed for url=%s error=%s", url, last_error)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="URL extraction took too long or the page blocked extraction. Try a simpler public page.",
        ) from last_error
