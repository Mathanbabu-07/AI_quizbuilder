"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeEmojiRushGame,
  fetchEmojiRushLeaderboard,
  saveEmojiRushRound,
  startEmojiRushGame,
  type EmojiRushLeaderboardEntry
} from "@/lib/emojiRushApi";
import { useEmojiRushStore } from "@/app/games/emoji-rush/store/emojiRushStore";

function getOrCreatePlayerId() {
  if (typeof window === "undefined") {
    return "emoji-rush-server";
  }

  const storageKey = "genquiz_emoji_rush_player_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const next = `emoji_${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, next);
  return next;
}

export function useEmojiRushBackend() {
  const [leaderboard, setLeaderboard] = useState<EmojiRushLeaderboardEntry[]>([]);
  const [saveNonce, setSaveNonce] = useState(0);
  const sessionId = useEmojiRushStore((state) => state.sessionId);
  const playerId = useEmojiRushStore((state) => state.playerId);
  const playerName = useEmojiRushStore((state) => state.playerName);
  const phase = useEmojiRushStore((state) => state.phase);
  const totalScore = useEmojiRushStore((state) => state.totalScore);
  const lastRoundResult = useEmojiRushStore((state) => state.lastRoundResult);
  const startGame = useEmojiRushStore((state) => state.startGame);
  const attachSession = useEmojiRushStore((state) => state.attachSession);
  const setBackendStatus = useEmojiRushStore((state) => state.setBackendStatus);
  const savedRoundIds = useRef(new Set<string>());
  const confirmedRoundIds = useRef(new Set<string>());
  const completedSessionIds = useRef(new Set<string>());

  const startSecureGame = useCallback(
    async (name: string) => {
      const nextPlayerId = getOrCreatePlayerId();
      const nextName = name.trim() || "Player";
      startGame(nextPlayerId, nextName);

      try {
        const session = await startEmojiRushGame({ playerId: nextPlayerId, playerName: nextName });
        attachSession(session.session_id);
      } catch {
        setBackendStatus("offline", "Local play active. Progress will not sync until the API is reachable.");
      }
    },
    [attachSession, setBackendStatus, startGame]
  );

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetchEmojiRushLeaderboard(10);
      setLeaderboard(response.entries);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    const shouldSave = Boolean(lastRoundResult && (lastRoundResult.completed || phase === "game-over"));
    if (!sessionId || !playerId || !lastRoundResult || !shouldSave || savedRoundIds.current.has(lastRoundResult.id)) {
      return;
    }

    savedRoundIds.current.add(lastRoundResult.id);
    setBackendStatus("saving", "Saving round progress");
    saveEmojiRushRound({ sessionId, playerId, result: lastRoundResult })
      .then(() => {
        confirmedRoundIds.current.add(lastRoundResult.id);
        setSaveNonce((value) => value + 1);
        setBackendStatus("synced", "Round progress saved");
      })
      .catch(() => setBackendStatus("error", "Round finished locally, but secure save failed."));
  }, [lastRoundResult, phase, playerId, sessionId, setBackendStatus]);

  useEffect(() => {
    if (phase !== "game-over" || !sessionId || !playerId || completedSessionIds.current.has(sessionId)) {
      return;
    }
    if (lastRoundResult && savedRoundIds.current.has(lastRoundResult.id) && !confirmedRoundIds.current.has(lastRoundResult.id)) {
      return;
    }

    completedSessionIds.current.add(sessionId);
    setBackendStatus("saving", "Finalizing score");
    completeEmojiRushGame({ sessionId, playerId, totalScore })
      .then(() => {
        setBackendStatus("synced", "Final score secured");
        return loadLeaderboard();
      })
      .catch(() => setBackendStatus("error", "Final score stayed local because the API did not confirm it."));
  }, [lastRoundResult, loadLeaderboard, phase, playerId, saveNonce, sessionId, setBackendStatus, totalScore]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    leaderboard,
    playerName,
    startSecureGame,
    refreshLeaderboard: loadLeaderboard
  };
}
