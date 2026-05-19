"use client";

import { useEffect, useRef } from "react";
import { saveHandCricketMatch } from "@/lib/handCricketApi";
import { useHandCricketStore } from "@/app/games/hand-cricket/store/handCricketStore";

export function usePersistHandCricketResult() {
  const status = useHandCricketStore((state) => state.status);
  const result = useHandCricketStore((state) => state.result);
  const playerScore = useHandCricketStore((state) => state.playerScore);
  const aiScore = useHandCricketStore((state) => state.aiScore);
  const savedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "result" || !result) {
      return;
    }

    const saveKey = `${playerScore}:${aiScore}:${result}`;
    if (savedKeyRef.current === saveKey) {
      return;
    }
    savedKeyRef.current = saveKey;

    saveHandCricketMatch({
      playerName: "Player",
      playerScore,
      aiScore,
      winner: result === "win" ? "player" : result === "lose" ? "ai" : "draw"
    }).catch((error) => {
      console.warn("[GENQUIZ] Hand Cricket match history was not saved.", error);
    });
  }, [aiScore, playerScore, result, status]);
}
