"use client";

import { useEffect } from "react";
import { useHandCricketStore } from "@/app/games/hand-cricket/store/handCricketStore";

export function useHandCricketTimer() {
  const status = useHandCricketStore((state) => state.status);
  const isRevealing = useHandCricketStore((state) => state.isRevealing);
  const tick = useHandCricketStore((state) => state.tick);

  useEffect(() => {
    if (status !== "playing" || isRevealing) {
      return;
    }

    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRevealing, status, tick]);
}
