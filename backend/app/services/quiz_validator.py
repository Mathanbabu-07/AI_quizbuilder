import hashlib
import random
import re
from typing import Any

from pydantic import ValidationError

from app.models.quiz import Difficulty, GeneratedQuiz


class QuizValidationError(ValueError):
    pass


def validate_quiz_payload(
    payload: dict[str, Any],
    *,
    question_count: int,
    difficulty: Difficulty,
    time_per_question: int,
    points_per_question: int,
    shuffle_options: bool = False,
) -> GeneratedQuiz:
    payload = _normalize_quiz_payload(
        payload,
        question_count=question_count,
        difficulty=difficulty,
        time_per_question=time_per_question,
        points_per_question=points_per_question,
        shuffle_options=shuffle_options,
    )
    try:
        quiz = GeneratedQuiz.model_validate(payload)
    except ValidationError as exc:
        raise QuizValidationError(str(exc)) from exc

    if len(quiz.questions) != question_count:
        raise QuizValidationError(f"Generated {len(quiz.questions)} questions, expected {question_count}.")

    normalized_questions: set[str] = set()
    for question in quiz.questions:
        key = " ".join(question.question.casefold().split())
        if key in normalized_questions:
            raise QuizValidationError("Duplicate questions are not allowed.")
        normalized_questions.add(key)

        if question.difficulty != difficulty:
            raise QuizValidationError("AI response did not maintain the requested difficulty.")

        question.time_limit = time_per_question
        question.points = points_per_question

    return quiz


def normalize_quiz_payload(
    payload: dict[str, Any],
    *,
    question_count: int,
    difficulty: Difficulty,
    time_per_question: int,
    points_per_question: int,
    shuffle_options: bool = False,
) -> dict[str, Any]:
    return _normalize_quiz_payload(
        payload,
        question_count=question_count,
        difficulty=difficulty,
        time_per_question=time_per_question,
        points_per_question=points_per_question,
        shuffle_options=shuffle_options,
    )


def _normalize_quiz_payload(
    payload: dict[str, Any],
    *,
    question_count: int,
    difficulty: Difficulty,
    time_per_question: int,
    points_per_question: int,
    shuffle_options: bool,
) -> dict[str, Any]:
    if "quiz" in payload and isinstance(payload["quiz"], dict):
        payload = payload["quiz"]

    title = _clean_text(payload.get("title")) or "GENQUIZ Quiz"
    quiz_seed = _stable_seed(title, str(question_count), difficulty)
    raw_questions = payload.get("questions") or payload.get("mcqs") or payload.get("items") or []
    if not isinstance(raw_questions, list):
        raise QuizValidationError("AI response questions must be a list.")

    normalized_questions: list[dict[str, Any]] = []
    for item in raw_questions:
        if not isinstance(item, dict):
            continue

        question_text = _clean_text(
            item.get("question")
            or item.get("question_text")
            or item.get("prompt")
            or item.get("text")
        )
        options = _normalize_options(item.get("options") or item.get("choices") or item.get("answers"))
        answer = _clean_text(
            item.get("correctAnswer")
            or item.get("correct_answer")
            or item.get("answer")
            or item.get("correct")
            or item.get("correctOption")
        )
        explanation = _clean_text(
            item.get("explanation")
            or item.get("rationale")
            or item.get("reason")
            or item.get("why")
        )

        if not question_text or len(options) < 4 or not answer:
            continue

        answer = _resolve_answer(answer, options)
        if answer not in options:
            options = _trim_options_keeping_answer(options, answer)
        else:
            options = _trim_options_keeping_answer(options, answer)

        if len(options) != 4 or answer not in options:
            continue
        if shuffle_options:
            options = _shuffle_options(
                options,
                answer,
                question_index=len(normalized_questions),
                quiz_seed=quiz_seed,
                question_text=question_text,
            )

        normalized_questions.append(
            {
                "question": question_text,
                "options": options,
                "correctAnswer": answer,
                "explanation": explanation[:600],
                "difficulty": difficulty,
                "timeLimit": time_per_question,
                "points": points_per_question,
            }
        )

        if len(normalized_questions) == question_count:
            break

    return {"title": title[:120], "questions": normalized_questions}


def _normalize_options(value: Any) -> list[str]:
    if isinstance(value, dict):
        ordered_keys = ["A", "B", "C", "D", "a", "b", "c", "d", "1", "2", "3", "4"]
        items = [value[key] for key in ordered_keys if key in value]
        if not items:
            items = list(value.values())
        value = items

    if not isinstance(value, list):
        return []

    options: list[str] = []
    seen: set[str] = set()
    for option in value:
        cleaned = _clean_text(option)
        if not cleaned:
            continue
        cleaned = _strip_option_label(cleaned)
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        options.append(cleaned[:240])
    return options


def _resolve_answer(answer: str, options: list[str]) -> str:
    clean_answer = _strip_option_label(answer)
    letter_map = {"a": 0, "b": 1, "c": 2, "d": 3}
    lowered = clean_answer.casefold().strip(".:)")
    if lowered in letter_map and letter_map[lowered] < len(options):
        return options[letter_map[lowered]]
    if lowered.isdigit():
        index = int(lowered) - 1
        if 0 <= index < len(options):
            return options[index]

    for option in options:
        if option.casefold() == clean_answer.casefold():
            return option
    for option in options:
        if option.casefold().startswith(clean_answer.casefold()) or clean_answer.casefold().startswith(option.casefold()):
            return option
    return clean_answer[:240]


def _trim_options_keeping_answer(options: list[str], answer: str) -> list[str]:
    if answer in options[:4]:
        return options[:4]
    if answer in options:
        return options[:3] + [answer]
    return options[:3] + [answer]


def _shuffle_options(
    options: list[str],
    answer: str,
    *,
    question_index: int,
    quiz_seed: int,
    question_text: str,
) -> list[str]:
    distractors = [option for option in options if option != answer]
    rng = random.Random(_stable_seed(str(quiz_seed), question_text, answer))
    rng.shuffle(distractors)

    answer_position = (quiz_seed + question_index) % 4
    shuffled: list[str] = []
    distractor_index = 0

    for option_index in range(4):
        if option_index == answer_position:
            shuffled.append(answer)
        else:
            shuffled.append(distractors[distractor_index])
            distractor_index += 1

    return shuffled


def _stable_seed(*parts: str) -> int:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(part.encode("utf-8", errors="ignore"))
        digest.update(b"\0")
    return int.from_bytes(digest.digest()[:8], "big")


def _strip_option_label(value: str) -> str:
    return re.sub(r"^[A-Da-d1-4][\).\:\-]\s*", "", value).strip()


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().split())
