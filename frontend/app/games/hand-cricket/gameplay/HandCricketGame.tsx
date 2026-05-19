"use client";

import { useEffect } from "react";
import { GameHUD } from "@/app/games/hand-cricket/components/GameHUD";
import { StadiumBackground } from "@/app/games/hand-cricket/components/StadiumBackground";
import { useHandCricketReveal } from "@/app/games/hand-cricket/hooks/useHandCricketReveal";
import { useHandCricketTimer } from "@/app/games/hand-cricket/hooks/useHandCricketTimer";
import { usePersistHandCricketResult } from "@/app/games/hand-cricket/hooks/usePersistHandCricketResult";
import { useHandCricketStore } from "@/app/games/hand-cricket/store/handCricketStore";

export function HandCricketGame() {
  const resetMatch = useHandCricketStore((state) => state.resetMatch);

  useHandCricketTimer();
  useHandCricketReveal();
  usePersistHandCricketResult();

  useEffect(() => {
    resetMatch();
  }, [resetMatch]);

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-950 text-white">
      <StadiumBackground />
      <GameHUD />
    </main>
  );
}
