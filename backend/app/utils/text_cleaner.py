import html
import re
from html.parser import HTMLParser


_BLOCK_TAGS = {
    "article",
    "aside",
    "blockquote",
    "br",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "td",
    "th",
    "tr",
    "ul",
}
_IGNORED_TAGS = {"script", "style", "svg", "canvas", "noscript", "iframe", "form"}
_JUNK_PATTERNS = re.compile(
    r"\b(cookie|privacy policy|subscribe|newsletter|advertisement|sign in|share this|"
    r"all rights reserved|terms of use)\b",
    re.IGNORECASE,
)


class _ReadableHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._parts: list[str] = []
        self.title: str | None = None
        self._collect_title = False
        self._title_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized = tag.lower()
        if normalized in _IGNORED_TAGS:
            self._skip_depth += 1
            return
        if normalized == "title":
            self._collect_title = True
            return
        if normalized in _BLOCK_TAGS:
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        normalized = tag.lower()
        if normalized in _IGNORED_TAGS and self._skip_depth:
            self._skip_depth -= 1
            return
        if normalized == "title":
            self._collect_title = False
            title = clean_plain_text(" ".join(self._title_parts), max_characters=140)
            self.title = title or None
            return
        if normalized in _BLOCK_TAGS:
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        if self._collect_title:
            self._title_parts.append(data)
            return
        self._parts.append(data)

    def text(self) -> str:
        return "".join(self._parts)


def extract_readable_text_from_html(payload: str, max_characters: int) -> tuple[str, str | None]:
    parser = _ReadableHTMLParser()
    parser.feed(payload)
    parser.close()
    return clean_plain_text(parser.text(), max_characters=max_characters), parser.title


def clean_plain_text(value: str, *, max_characters: int | None = None) -> str:
    text = html.unescape(value)
    text = text.replace("\x00", " ")
    text = re.sub(r"[\u200b-\u200f\ufeff]", "", text)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    paragraphs: list[str] = []
    seen: set[str] = set()
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" -\t")
        if len(line) < 3:
            continue
        if _JUNK_PATTERNS.search(line) and len(line) < 120:
            continue
        key = line.casefold()
        if key in seen:
            continue
        seen.add(key)
        paragraphs.append(line)

    cleaned = "\n".join(paragraphs)
    if max_characters and len(cleaned) > max_characters:
        return cleaned[:max_characters].rsplit("\n", 1)[0].strip() or cleaned[:max_characters].strip()
    return cleaned.strip()
