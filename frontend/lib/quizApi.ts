import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const GENERATION_CLIENT_TIMEOUT_MS = 125_000;

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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GENERATION_CLIENT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
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
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI quiz generation is taking longer than expected. Try fewer questions or generate again.");
    }

    throw new Error("Could not reach the GENQUIZ backend. Check that the backend server is running.");
  } finally {
    window.clearTimeout(timeoutId);
  }

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
