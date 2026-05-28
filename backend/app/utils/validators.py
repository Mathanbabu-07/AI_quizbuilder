from urllib.parse import urlparse

from fastapi import HTTPException, status


def ensure_upload_size(payload: bytes, max_mb: int) -> None:
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(payload) > max_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Max upload size is {max_mb}MB.",
        )


def ensure_public_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or "." not in parsed.netloc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid public webpage URL.")
    if parsed.hostname in {"localhost", "127.0.0.1", "0.0.0.0"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Local URLs cannot be extracted.")
    return url
