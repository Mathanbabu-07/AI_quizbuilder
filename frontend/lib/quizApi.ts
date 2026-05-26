import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

const GENERATION_CLIENT_TIMEOUT_MS = 125_000;
const FILE_UPLOAD_CLIENT_TIMEOUT_MS = 70_000;
const URL_EXTRACTION_CLIENT_TIMEOUT_MS = 55_000;
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

export type UploadedQuizFile = {
  file_id: string;
  filename: string;
  file_type: "pdf" | "pptx";
  extracted_characters: number;
  preview: string;
};

export type GenerateFromFileOptions = {
  uploadedFileId: string;
  mode: "solo" | "multiplayer";
  questionCount: number;
  difficulty: QuizSettings["difficulty"];
  timePerQuestion: number;
  pointsPerQuestion: number;
  userPrompt?: string;
  hostId?: string | null;
  hostName?: string;
};

export type ExtractedUrlContent = {
  extraction_id: string;
  url: string;
  title?: string | null;
  extracted_characters: number;
  preview: string;
};

export type GenerateFromUrlOptions = {
  extractionId?: string;
  url?: string;
  mode: "solo" | "multiplayer";
  questionCount: number;
  difficulty: QuizSettings["difficulty"];
  timePerQuestion: number;
  pointsPerQuestion: number;
  userPrompt?: string;
  hostId?: string | null;
  hostName?: string;
};

type GenerateFromFileApiResponse = {
  quiz: GeneratedQuiz;
  meta: {
    room_code?: string | null;
  };
};

type GenerateFromUrlApiResponse = GenerateFromFileApiResponse;

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
        total_quiz_time: settings.totalQuizTime,
        points_per_question: settings.pointsPerQuestion ?? 1
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

export async function uploadQuizFile(file: File): Promise<UploadedQuizFile> {
  const apiBaseUrl = getApiBaseUrl();

  let response: Response;

  try {
    response = await uploadQuizFileRequest(apiBaseUrl, file);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("File extraction is taking longer than expected. Try a smaller PDF or PPTX.");
    }

    await wait(NETWORK_RETRY_DELAY_MS);

    try {
      response = await uploadQuizFileRequest(apiBaseUrl, file);
    } catch (retryError) {
      if (retryError instanceof DOMException && retryError.name === "AbortError") {
        throw new Error("File extraction is taking longer than expected. Try a smaller PDF or PPTX.");
      }
      throw new Error(`Could not reach the GENQUIZ backend at ${apiBaseUrl}. Check the API URL and backend server status.`);
    }
  }

  if (!response.ok) {
    throw new Error(await readApiError(response, "File upload failed. Try a smaller PDF or PPTX."));
  }

  return (await response.json()) as UploadedQuizFile;
}

async function uploadQuizFileRequest(apiBaseUrl: string, file: File) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), FILE_UPLOAD_CLIENT_TIMEOUT_MS);
  const formData = new FormData();
  formData.append("file", file);

  try {
    return await fetch(`${apiBaseUrl}/api/quiz/upload`, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      body: formData,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function generateQuizFromFile(options: GenerateFromFileOptions): Promise<{
  quiz: GeneratedQuiz;
  roomCode: string | null;
}> {
  const apiBaseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GENERATION_CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}/api/quiz/generate-from-file`, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file_id: options.uploadedFileId,
        mode: options.mode,
        user_prompt: options.userPrompt?.trim() || null,
        question_count: options.questionCount,
        difficulty: options.difficulty,
        time_per_question: options.timePerQuestion,
        points_per_question: options.pointsPerQuestion,
        host_id: options.hostId,
        host_name: options.hostName ?? "Host"
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "File quiz generation failed. Please try again."));
    }

    const payload = (await response.json()) as GenerateFromFileApiResponse;
    return {
      quiz: payload.quiz,
      roomCode: payload.meta.room_code ?? null
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("File quiz generation is taking longer than expected. Try fewer questions or a smaller file.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Could not reach the GENQUIZ backend at ${apiBaseUrl}. Check the API URL and backend server status.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function extractUrlContent(url: string): Promise<ExtractedUrlContent> {
  const apiBaseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), URL_EXTRACTION_CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}/api/url-quiz/extract`, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: url.trim() }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "URL extraction failed. Try another public page."));
    }

    return (await response.json()) as ExtractedUrlContent;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("URL extraction is taking longer than expected. Try a shorter public article or documentation page.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Could not reach the GENQUIZ backend at ${apiBaseUrl}. Check the API URL and backend server status.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function generateQuizFromUrl(options: GenerateFromUrlOptions): Promise<{
  quiz: GeneratedQuiz;
  roomCode: string | null;
}> {
  const apiBaseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GENERATION_CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}/api/url-quiz/generate`, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        extraction_id: options.extractionId ?? null,
        url: options.url?.trim() || null,
        mode: options.mode,
        user_prompt: options.userPrompt?.trim() || null,
        question_count: options.questionCount,
        difficulty: options.difficulty,
        time_per_question: options.timePerQuestion,
        points_per_question: options.pointsPerQuestion,
        host_id: options.hostId,
        host_name: options.hostName ?? "Host"
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "URL quiz generation failed. Please try again."));
    }

    const payload = (await response.json()) as GenerateFromUrlApiResponse;
    return {
      quiz: payload.quiz,
      roomCode: payload.meta.room_code ?? null
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("URL quiz generation is taking longer than expected. Try fewer questions or a shorter page.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Could not reach the GENQUIZ backend at ${apiBaseUrl}. Check the API URL and backend server status.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return normalizeApiError(payload) ?? fallback;
  } catch {
    return `${fallback} Status ${response.status}.`;
  }
}
