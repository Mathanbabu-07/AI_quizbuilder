import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type GenerateQuizApiResponse = {
  quiz: GeneratedQuiz;
};

type ApiErrorPayload = {
  detail?: unknown;
};

function normalizeApiError(payload: ApiErrorPayload): string | null {
  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String(item.msg);
        }
        return String(item);
      })
      .join(" ");
  }

  return null;
}

export async function generateQuiz(settings: QuizSettings): Promise<GeneratedQuiz> {
  const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: settings.prompt,
      question_count: settings.questionCount,
      difficulty: settings.difficulty,
      time_per_question: settings.timePerQuestion,
      total_quiz_time: settings.totalQuizTime
    })
  });

  if (!response.ok) {
    let detail = "Quiz generation failed. Please try again.";

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      const normalized = normalizeApiError(payload);
      if (normalized) {
        detail = normalized;
      }
    } catch {
      detail = `Quiz generation failed with status ${response.status}.`;
    }

    throw new Error(detail);
  }

  const payload = (await response.json()) as GenerateQuizApiResponse;
  return payload.quiz;
}
