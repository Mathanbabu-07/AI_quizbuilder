import type { MemoryGridMedal, MemoryGridResult, MemoryGridRoundResult } from "@/app/games/memory-grid/store/memoryGridStore";

export type MemoryGridSession = {
  session_id: string;
  player_id: string;
  player_name: string;
  status: "active" | "completed" | "abandoned";
  current_round: number;
  completed_rounds: number;
  total_score: number;
  hearts_remaining: number;
  total_accuracy: number;
  completion_time_ms: number;
  result: MemoryGridResult;
  medal: MemoryGridMedal | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type MemoryGridLeaderboardEntry = {
  session_id: string;
  player_id: string;
  player_name: string;
  total_score: number;
  completed_rounds: number;
  hearts_remaining: number;
  total_accuracy: number;
  completion_time_ms: number;
  medal: MemoryGridMedal;
  created_at?: string | null;
};

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");

  if (!apiUrl) {
    throw new Error("GENQUIZ API URL is not configured. Set NEXT_PUBLIC_API_URL.");
  }

  return apiUrl;
}

async function parseJsonResponse<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function startMemoryGridGame(payload: {
  playerId: string;
  playerName: string;
}): Promise<MemoryGridSession> {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      player_id: payload.playerId,
      player_name: payload.playerName
    })
  });

  return parseJsonResponse<MemoryGridSession>(response, "Memory Grid start");
}

export async function saveMemoryGridRound(payload: {
  sessionId: string;
  playerId: string;
  result: MemoryGridRoundResult;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/rounds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      round_number: payload.result.roundNumber,
      score: payload.result.score,
      correct_targets: payload.result.correctTargets,
      wrong_attempts: payload.result.wrongAttempts,
      total_selections: payload.result.totalSelections,
      remaining_hearts: payload.result.remainingHearts,
      duration_ms: payload.result.durationMs,
      completed: payload.result.completed,
      grid_rows: payload.result.gridRows,
      grid_cols: payload.result.gridCols,
      memorize_seconds: payload.result.memorizeSeconds,
      target_count: payload.result.targetCount
    })
  });

  return parseJsonResponse<{ accepted: boolean; session: MemoryGridSession }>(response, "Memory Grid round save");
}

export async function updateMemoryGridLifelines(payload: {
  sessionId: string;
  playerId: string;
  roundNumber: number;
  remainingHearts: number;
  wrongAttempts: number;
  reason: "wrong_selection" | "timeout";
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/lifelines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      round_number: payload.roundNumber,
      remaining_hearts: payload.remainingHearts,
      wrong_attempts: payload.wrongAttempts,
      reason: payload.reason
    })
  });

  return parseJsonResponse<{ accepted: boolean; session: MemoryGridSession }>(response, "Memory Grid lifeline update");
}

export async function completeMemoryGridGame(payload: {
  sessionId: string;
  playerId: string;
  totalScore: number;
  result: MemoryGridResult;
  remainingHearts: number;
  totalAccuracy: number;
  completionTimeMs: number;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      reported_total_score: payload.totalScore,
      result: payload.result,
      remaining_hearts: payload.remainingHearts,
      total_accuracy: payload.totalAccuracy,
      completion_time_ms: payload.completionTimeMs
    })
  });

  return parseJsonResponse<{ medal: MemoryGridMedal; leaderboard_saved: boolean; session: MemoryGridSession }>(
    response,
    "Memory Grid completion"
  );
}

export async function retryMemoryGridSession(payload: {
  playerId: string;
  playerName: string;
  previousSessionId?: string | null;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      player_id: payload.playerId,
      player_name: payload.playerName,
      previous_session_id: payload.previousSessionId
    })
  });

  return parseJsonResponse<MemoryGridSession>(response, "Memory Grid retry");
}

export async function fetchMemoryGridLeaderboard(limit = 10) {
  const response = await fetch(`${getApiBaseUrl()}/api/memory-grid/leaderboard?limit=${limit}`, {
    method: "GET"
  });

  return parseJsonResponse<{ entries: MemoryGridLeaderboardEntry[] }>(response, "Memory Grid leaderboard");
}
