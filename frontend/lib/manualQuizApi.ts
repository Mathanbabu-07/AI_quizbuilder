import type { ManualQuizSavePayload, SavedManualQuiz, SavedManualQuizSummary } from "@/types/manualQuiz";

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");

  if (!apiUrl) {
    throw new Error("GENQUIZ API URL is not configured. Set NEXT_PUBLIC_API_URL.");
  }

  return apiUrl;
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    return normalizeDetail(payload.detail) ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function normalizeDetail(detail: unknown): string | null {
  if (!detail) {
    return null;
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }
        return null;
      })
      .filter(Boolean)
      .join(" ");
  }

  if (typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return String(detail);
}

export async function listManualQuizzes(hostId: string): Promise<SavedManualQuizSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/manual-quizzes?host_id=${encodeURIComponent(hostId)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readError(response);
    console.error("[GENQUIZ] saved quiz list failed", { status: response.status, message });
    throw new Error(message);
  }

  const payload = (await response.json()) as { quizzes: SavedManualQuizSummary[] };
  console.debug("[GENQUIZ] saved quizzes loaded", { count: payload.quizzes.length });
  return payload.quizzes;
}

export async function getManualQuiz(quizId: string, hostId: string): Promise<SavedManualQuiz> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/manual-quizzes/${encodeURIComponent(quizId)}?host_id=${encodeURIComponent(hostId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const message = await readError(response);
    console.error("[GENQUIZ] saved quiz open failed", { status: response.status, quizId, message });
    throw new Error(message);
  }

  const saved = (await response.json()) as SavedManualQuiz;
  console.debug("[GENQUIZ] saved quiz opened", { quizId: saved.id, questions: saved.questions.length });
  return saved;
}

export async function saveManualQuiz(payload: ManualQuizSavePayload, quizId?: string): Promise<SavedManualQuiz> {
  console.debug("[GENQUIZ] saving manual quiz", {
    quizId: quizId ?? "new",
    title: payload.title,
    questions: payload.questions.length,
    roomCode: payload.roomCode
  });

  const response = await fetch(`${getApiBaseUrl()}/api/manual-quizzes${quizId ? `/${encodeURIComponent(quizId)}` : ""}`, {
    method: quizId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await readError(response);
    console.error("[GENQUIZ] manual quiz save failed", { status: response.status, message });
    throw new Error(message);
  }

  const saved = (await response.json()) as SavedManualQuiz;
  console.debug("[GENQUIZ] manual quiz saved", { quizId: saved.id, questions: saved.questions.length, roomCode: saved.room_code });
  return saved;
}

export async function deleteManualQuiz(quizId: string, hostId: string): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/manual-quizzes/${encodeURIComponent(quizId)}?host_id=${encodeURIComponent(hostId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const message = await readError(response);
    console.error("[GENQUIZ] saved quiz delete failed", { status: response.status, quizId, message });
    throw new Error(message);
  }
}
