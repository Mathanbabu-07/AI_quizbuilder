import asyncio
import re
import time
from dataclasses import dataclass

from fastapi import HTTPException, status


@dataclass
class PDFExtractor:
    timeout_seconds: float = 12.0
    max_pages: int = 80
    max_characters: int = 90_000

    async def extract_text(self, payload: bytes) -> str:
        return await asyncio.to_thread(self._extract_sync, payload)

    def _extract_sync(self, payload: bytes) -> str:
        try:
            import fitz
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="PDF extraction dependency is missing. Install PyMuPDF on the backend.",
            ) from exc

        started_at = time.monotonic()
        chunks: list[str] = []

        try:
            with fitz.open(stream=payload, filetype="pdf") as document:
                for page_index, page in enumerate(document):
                    if page_index >= self.max_pages:
                        break
                    if time.monotonic() - started_at > self.timeout_seconds:
                        raise TimeoutError("PDF extraction timed out.")

                    text = page.get_text("text", sort=True)
                    if text:
                        chunks.append(text)

                    if sum(len(chunk) for chunk in chunks) >= self.max_characters:
                        break
        except TimeoutError as exc:
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="PDF extraction took too long. Try a smaller file.",
            ) from exc
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read this PDF. Upload a readable PDF file.",
            ) from exc

        return clean_extracted_text("\n".join(chunks), self.max_characters)


def clean_extracted_text(value: str, max_characters: int = 90_000) -> str:
    cleaned_lines: list[str] = []

    for raw_line in value.splitlines():
        line = re.sub(r"[^\S\r\n]+", " ", raw_line).strip()
        line = "".join(char for char in line if char.isprintable())
        if len(line) < 2:
            continue
        cleaned_lines.append(line)

    cleaned = "\n".join(cleaned_lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned[:max_characters].strip()
