from app.models.quiz import GenerateQuizRequest


def build_quiz_prompt(request: GenerateQuizRequest) -> list[dict[str, str]]:
    system = (
        "You are GENQUIZ, an expert assessment designer. "
        "Return only one strict JSON object. Do not wrap the JSON in markdown. "
        "Do not include explanations, comments, trailing commas, or extra keys. "
        "Every string must be valid JSON with escaped double quotes and escaped newlines. "
        "Do not place unescaped quote characters inside question or choice strings."
    )

    user = f"""
Create a high-quality multiple choice quiz.

Topic request:
{request.prompt}

Rules:
- Generate exactly {request.question_count} questions.
- Difficulty must be exactly "{request.difficulty}" for every question.
- Each question must have exactly 4 unique choices.
- correctAnswer must exactly match one of the 4 options.
- explanation must briefly justify the correct answer in one sentence.
- timeLimit must be {request.time_per_question}.
- points must be {request.points_per_question}.
- Avoid duplicates and trivial wording.
- Keep questions concise, meaningful, and factually grounded.
- Keep choices plausible and balanced.
- Vary the correct answer position naturally; do not put the correct answer first for every question.
- Keep each question under 140 characters when possible.
- Keep each choice under 70 characters when possible.
- For programming quizzes, include short code snippets only when they are necessary.
- If code needs quotes, prefer single quotes inside the code snippet.
- Escape every JSON string correctly. Never return malformed JSON.

Return this exact JSON shape:
{{
  "title": "Short quiz title",
  "questions": [
    {{
      "question": "Question text",
      "options": ["Distractor choice", "Correct choice", "Another distractor", "Final distractor"],
      "correctAnswer": "Correct choice",
      "explanation": "One sentence explanation",
      "timeLimit": {request.time_per_question},
      "points": {request.points_per_question}
    }}
  ]
}}
""".strip()

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
