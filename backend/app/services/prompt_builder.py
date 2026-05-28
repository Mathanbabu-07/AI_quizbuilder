from app.models.quiz import GenerateFromFileRequest


def build_file_quiz_prompt(request: GenerateFromFileRequest, source_text: str) -> list[dict[str, str]]:
    system = (
        "You are GENQUIZ, an expert quiz verifier and assessment designer. "
        "Use only the provided source text. Return exactly one valid JSON object. "
        "Do not include markdown, comments, explanations, code fences, or extra keys."
    )

    user_specs = (request.user_prompt or "").strip()
    specification_block = (
        f"\nUser quiz specifications:\n{user_specs}\n"
        if user_specs
        else "\nUser quiz specifications:\nUse the most important concepts from the source.\n"
    )

    user = f"""
Create a multiple choice quiz from the source material below.
{specification_block}

Rules:
- Generate exactly {request.question_count} questions.
- Difficulty must be exactly "{request.difficulty}" for every question.
- Each question must have exactly 4 unique options.
- correctAnswer must exactly match one option.
- explanation must briefly justify the correct answer in one sentence using source-supported facts.
- timeLimit must be {request.time_per_question}.
- points must be {request.points_per_question}.
- Avoid duplicate questions and repeated answer patterns.
- Do not invent facts that are not supported by the source.
- Keep questions concise and clear.
- Follow the user quiz specifications when they do not conflict with the source or JSON rules.
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
      "explanation": "One sentence explanation",
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
