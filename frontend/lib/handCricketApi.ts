type HandCricketWinner = "player" | "ai" | "draw";

type HandCricketMatchPayload = {
  playerName?: string;
  playerScore: number;
  aiScore: number;
  winner: HandCricketWinner;
};

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");

  if (!apiUrl) {
    throw new Error("GENQUIZ API URL is not configured. Set NEXT_PUBLIC_API_URL.");
  }

  return apiUrl;
}

export async function saveHandCricketMatch(payload: HandCricketMatchPayload): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/hand-cricket/matches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      player_name: payload.playerName ?? "Player",
      player_score: payload.playerScore,
      ai_score: payload.aiScore,
      winner: payload.winner
    })
  });

  if (!response.ok) {
    throw new Error(`Hand Cricket match save failed with status ${response.status}.`);
  }
}
