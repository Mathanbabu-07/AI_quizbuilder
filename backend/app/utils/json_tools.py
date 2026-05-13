import json
import re
from typing import Any


def _strip_markdown_fence(text: str) -> str:
    cleaned = text.strip().replace("\ufeff", "")
    cleaned = re.sub(r"^```(?:json|JSON)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_balanced_object(text: str) -> str:
    start = text.find("{")
    if start == -1:
        raise ValueError("AI response did not contain a JSON object.")

    depth = 0
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]
        if escaped:
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]

    raise ValueError("AI response JSON object was not balanced.")


def _escape_raw_newlines_inside_strings(text: str) -> str:
    output: list[str] = []
    in_string = False
    escaped = False

    for char in text:
        if escaped:
            output.append(char)
            escaped = False
            continue
        if char == "\\":
            output.append(char)
            escaped = True
            continue
        if char == '"':
            output.append(char)
            in_string = not in_string
            continue
        if in_string and char in {"\n", "\r", "\t"}:
            output.append({"\n": "\\n", "\r": "\\r", "\t": "\\t"}[char])
            continue
        output.append(char)

    return "".join(output)


def _cleanup_json_like_text(text: str) -> str:
    cleaned = _strip_markdown_fence(text)
    cleaned = cleaned.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    cleaned = _extract_balanced_object(cleaned)
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    cleaned = _escape_raw_newlines_inside_strings(cleaned)
    return cleaned


def extract_json_object(raw: str) -> dict[str, Any]:
    text = _cleanup_json_like_text(raw)

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("AI response JSON root must be an object.")
    return parsed
