from app.models.quiz import GenerateFromFileRequest


def build_file_quiz_prompt(request: GenerateFromFileRequest, source_text: str) -> list[dict[str, str]]:
    system = (
        "You are GENQUIZ, an expert quiz verifier and assessment designer. "
        "Use only the provided source text. Return exactly one valid JSON object. "
        "Do not include markdown, comments, explanations, code fences, or extra keys."
    )

    user = f"""
Create a multiple choice quiz from the source material below.

Rules:
- Generate exactly {request.question_count} questions.
- Difficulty must be exactly "{request.difficulty}" for every question.
- Each question must have exactly 4 unique options.
- correctAnswer must exactly match one option.
- timeLimit must be {request.time_per_question}.
- points must be {request.points_per_question}.
- Avoid duplicate questions and repeated answer patterns.
- Do not invent facts that are not supported by the source.
- Keep questions concise and clear.
- If the source is too thin for the requested count, use the best supported concepts without hallucinating.
- Return JSON only.

Required JSON shape:
{{
  "title": "Short quiz title",
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "difficulty": "{request.difficulty}",
      "timeLimit": {request.time_per_question},
      "points": {request.points_per_question}
    }}
  ]
}}

Source material:
{source_text}
""".strip()

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
