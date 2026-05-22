"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeMemoryGridGame,
  fetchMemoryGridLeaderboard,
  saveMemoryGridRound,
  startMemoryGridGame,
  updateMemoryGridLifelines,
  type MemoryGridLeaderboardEntry
} from "@/lib/memoryGridApi";
import {
  getMemoryGridAccuracy,
  getMemoryGridCompletionTime,
  useMemoryGridStore
} from "@/app/games/memory-grid/store/memoryGridStore";

function getOrCreatePlayerId() {
  if (typeof window === "undefined") {
    return "memory-grid-server";
  }

  const storageKey = "genquiz_memory_grid_player_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const next = `memory_${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, next);
  return next;
}

export function useMemoryGridBackend() {
  const [leaderboard, setLeaderboard] = useState<MemoryGridLeaderboardEntry[]>([]);
  const [saveNonce, setSaveNonce] = useState(0);
  const sessionId = useMemoryGridStore((state) => state.sessionId);
  const playerId = useMemoryGridStore((state) => state.playerId);
  const playerName = useMemoryGridStore((state) => state.playerName);
  const phase = useMemoryGridStore((state) => state.phase);
  const totalScore = useMemoryGridStore((state) => state.totalScore);
  const hearts = useMemoryGridStore((state) => state.hearts);
  const result = useMemoryGridStore((state) => state.result);
  const lastRoundResult = useMemoryGridStore((state) => state.lastRoundResult);
  const lastHeartEvent = useMemoryGridStore((state) => state.lastHeartEvent);
  const startGame = useMemoryGridStore((state) => state.startGame);
  const attachSession = useMemoryGridStore((state) => state.attachSession);
  const setBackendStatus = useMemoryGridStore((state) => state.setBackendStatus);
  const savedRoundIds = useRef(new Set<string>());
  const confirmedRoundIds = useRef(new Set<string>());
  const savedHeartIds = useRef(new Set<string>());
  const completedSessionIds = useRef(new Set<string>());

  const startSecureGame = useCallback(
    async (name: string) => {
      const nextPlayerId = getOrCreatePlayerId();
      const nextName = name.trim() || "Player";
      startGame(nextPlayerId, nextName);

      try {
        const session = await startMemoryGridGame({ playerId: nextPlayerId, playerName: nextName });
        attachSession(session.session_id);
      } catch {
        setBackendStatus("offline", "Local play active. Progress will sync when the API is reachable.");
      }
    },
    [attachSession, setBackendStatus, startGame]
  );

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetchMemoryGridLeaderboard(10);
      setLeaderboard(response.entries);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !playerId || !lastHeartEvent || savedHeartIds.current.has(lastHeartEvent.id)) {
      return;
    }

    savedHeartIds.current.add(lastHeartEvent.id);
    updateMemoryGridLifelines({
      sessionId,
      playerId,
      roundNumber: lastHeartEvent.roundNumber,
      remainingHearts: lastHeartEvent.remainingHearts,
      wrongAttempts: lastHeartEvent.wrongAttempts,
      reason: lastHeartEvent.reason
    }).catch(() => {
      setBackendStatus("error", "A heart update stayed local because the API did not confirm it.");
    });
  }, [lastHeartEvent, playerId, sessionId, setBackendStatus]);

  useEffect(() => {
    const shouldSave = Boolean(lastRoundResult && (lastRoundResult.completed || phase === "game-over"));
    if (!sessionId || !playerId || !lastRoundResult || !shouldSave || savedRoundIds.current.has(lastRoundResult.id)) {
      return;
    }

    savedRoundIds.current.add(lastRoundResult.id);
    setBackendStatus("saving", "Saving Memory Grid round");
    saveMemoryGridRound({ sessionId, playerId, result: lastRoundResult })
      .then(() => {
        confirmedRoundIds.current.add(lastRoundResult.id);
        setSaveNonce((value) => value + 1);
        setBackendStatus("synced", "Round secured");
      })
      .catch(() => setBackendStatus("error", "Round finished locally, but secure save failed."));
  }, [lastRoundResult, phase, playerId, sessionId, setBackendStatus]);

  useEffect(() => {
    const isCompletePhase = phase === "game-over" || phase === "victory";
    if (!isCompletePhase || !sessionId || !playerId || completedSessionIds.current.has(sessionId)) {
      return;
    }
    if (lastRoundResult && savedRoundIds.current.has(lastRoundResult.id) && !confirmedRoundIds.current.has(lastRoundResult.id)) {
      return;
    }

    completedSessionIds.current.add(sessionId);
    setBackendStatus("saving", "Finalizing Memory Grid score");
    completeMemoryGridGame({
      sessionId,
      playerId,
      totalScore,
      result,
      remainingHearts: hearts,
      totalAccuracy: getMemoryGridAccuracy(),
      completionTimeMs: getMemoryGridCompletionTime()
    })
      .then(() => {
        setBackendStatus("synced", "Final score secured");
        return loadLeaderboard();
      })
      .catch(() => setBackendStatus("error", "Final score stayed local because the API did not confirm it."));
  }, [hearts, lastRoundResult, loadLeaderboard, phase, playerId, result, saveNonce, sessionId, setBackendStatus, totalScore]);

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
