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
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function listManualQuizzes(hostId: string): Promise<SavedManualQuizSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/manual-quizzes?host_id=${encodeURIComponent(hostId)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = (await response.json()) as { quizzes: SavedManualQuizSummary[] };
  return payload.quizzes;
}

export async function getManualQuiz(quizId: string, hostId: string): Promise<SavedManualQuiz> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/manual-quizzes/${encodeURIComponent(quizId)}?host_id=${encodeURIComponent(hostId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as SavedManualQuiz;
}

export async function saveManualQuiz(payload: ManualQuizSavePayload, quizId?: string): Promise<SavedManualQuiz> {
  const response = await fetch(`${getApiBaseUrl()}/api/manual-quizzes${quizId ? `/${encodeURIComponent(quizId)}` : ""}`, {
    method: quizId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as SavedManualQuiz;
}

export async function deleteManualQuiz(quizId: string, hostId: string): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/manual-quizzes/${encodeURIComponent(quizId)}?host_id=${encodeURIComponent(hostId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
