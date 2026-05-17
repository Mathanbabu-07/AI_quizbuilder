import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

const GENERATION_CLIENT_TIMEOUT_MS = 125_000;
const PRODUCTION_API_FALLBACK = "https://genquiz-backend-exz2.onrender.com";
const NETWORK_RETRY_DELAY_MS = 850;

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");

  if (!apiUrl) {
    if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
      console.warn("[GENQUIZ] NEXT_PUBLIC_API_URL missing in deployed frontend. Falling back to Render backend.");
      return PRODUCTION_API_FALLBACK;
    }

    throw new Error("GENQUIZ API URL is not configured. Set NEXT_PUBLIC_API_URL in the frontend environment.");
  }

  try {
    const parsedUrl = new URL(apiUrl);
    const isLocalApi = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedUrl.hostname);
    const isDeployedFrontend =
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isLocalApi && isDeployedFrontend) {
      console.warn("[GENQUIZ] Ignoring localhost API URL in deployed frontend.", { apiUrl });
      return PRODUCTION_API_FALLBACK;
    }
  } catch {
    throw new Error("GENQUIZ API URL is invalid. Check NEXT_PUBLIC_API_URL in the frontend environment.");
  }

  return apiUrl;
}

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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchGeneration(apiBaseUrl: string, settings: QuizSettings, attempt: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GENERATION_CLIENT_TIMEOUT_MS);

  try {
    return await fetch(`${apiBaseUrl}/api/quiz/generate`, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: {
        Accept: "application/json",
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
    console.error("[GENQUIZ] AI generation fetch failed", {
      apiBaseUrl,
      attempt,
      error
    });
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function generateQuiz(settings: QuizSettings): Promise<GeneratedQuiz> {
  const apiBaseUrl = getApiBaseUrl();

  let response: Response;

  try {
    response = await fetchGeneration(apiBaseUrl, settings, 1);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI quiz generation is taking longer than expected. Try fewer questions or generate again.");
    }

    await wait(NETWORK_RETRY_DELAY_MS);

    try {
      response = await fetchGeneration(apiBaseUrl, settings, 2);
    } catch (retryError) {
      if (retryError instanceof DOMException && retryError.name === "AbortError") {
        throw new Error("AI quiz generation is taking longer than expected. Try fewer questions or generate again.");
      }

      throw new Error(`Could not reach the GENQUIZ backend at ${apiBaseUrl}. Check the API URL and backend server status.`);
    }
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
