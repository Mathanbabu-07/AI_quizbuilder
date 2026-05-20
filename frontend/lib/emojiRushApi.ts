import type { EmojiRushMedal, EmojiRushRoundResult } from "@/app/games/emoji-rush/store/emojiRushStore";

export type EmojiRushSession = {
  session_id: string;
  player_id: string;
  player_name: string;
  status: "active" | "completed" | "abandoned";
  current_round: number;
  completed_rounds: number;
  total_score: number;
  medal: EmojiRushMedal | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EmojiRushLeaderboardEntry = {
  session_id: string;
  player_id: string;
  player_name: string;
  total_score: number;
  completed_rounds: number;
  medal: EmojiRushMedal;
  best_combo: number;
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

export async function startEmojiRushGame(payload: {
  playerId: string;
  playerName: string;
}): Promise<EmojiRushSession> {
  const response = await fetch(`${getApiBaseUrl()}/api/emoji-rush/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      player_id: payload.playerId,
      player_name: payload.playerName
    })
  });

  return parseJsonResponse<EmojiRushSession>(response, "Emoji Rush start");
}

export async function saveEmojiRushRound(payload: {
  sessionId: string;
  playerId: string;
  result: EmojiRushRoundResult;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/emoji-rush/rounds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      round_number: payload.result.roundNumber,
      points: payload.result.points,
      match3_count: payload.result.match3Count,
      match5_count: payload.result.match5Count,
      max_combo: payload.result.maxCombo,
      moves: payload.result.moves,
      duration_ms: payload.result.durationMs,
      completed: payload.result.completed,
      board_size: payload.result.boardSize,
      emoji_variety: payload.result.emojiVariety
    })
  });

  return parseJsonResponse<{ accepted: boolean; session: EmojiRushSession }>(response, "Emoji Rush round save");
}

export async function completeEmojiRushGame(payload: {
  sessionId: string;
  playerId: string;
  totalScore: number;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/emoji-rush/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      reported_total_score: payload.totalScore
    })
  });

  return parseJsonResponse<{ medal: EmojiRushMedal; leaderboard_saved: boolean; session: EmojiRushSession }>(
    response,
    "Emoji Rush completion"
  );
}

export async function fetchEmojiRushLeaderboard(limit = 10) {
  const response = await fetch(`${getApiBaseUrl()}/api/emoji-rush/leaderboard?limit=${limit}`, {
    method: "GET"
  });

  return parseJsonResponse<{ entries: EmojiRushLeaderboardEntry[] }>(response, "Emoji Rush leaderboard");
}
