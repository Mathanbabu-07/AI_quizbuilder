import logging
from dataclasses import dataclass
from urllib.parse import urlparse

from fastapi import HTTPException, status

from app.core.config import Settings
from app.services.scrape_service import ScrapeDoService
from app.utils.text_cleaner import clean_plain_text, extract_readable_text_from_html

logger = logging.getLogger("genquiz.url_extractor")


@dataclass
class UrlExtraction:
    url: str
    title: str | None
    text: str


@dataclass
class URLExtractor:
    settings: Settings

    async def extract(self, raw_url: str) -> UrlExtraction:
        url = self._normalize_url(raw_url)
        payload = await ScrapeDoService(self.settings).fetch(url)
        content_type_hint = payload[:400].lower()
        if "<html" in content_type_hint or "<body" in content_type_hint or "<article" in content_type_hint:
            text, title = extract_readable_text_from_html(payload, max_characters=self.settings.max_url_content_length)
        else:
            text = clean_plain_text(payload, max_characters=self.settings.max_url_content_length)
            title = None

        if len(text) < 300:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Not enough readable learning content was found at this URL. Try a public article, blog, or documentation page.",
            )

        logger.info("URL extracted for quiz generation url=%s chars=%s", url, len(text))
        return UrlExtraction(url=url, title=title, text=text)

    def _normalize_url(self, raw_url: str) -> str:
        url = raw_url.strip()
        if not url:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid URL.")

        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or "." not in parsed.netloc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid public webpage URL.")

        if parsed.hostname in {"localhost", "127.0.0.1", "0.0.0.0"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Local URLs cannot be extracted.")

        return url
