"use client";

import { useEffect } from "react";
import { useHandCricketStore } from "@/app/games/hand-cricket/store/handCricketStore";

export function useHandCricketReveal() {
  const isRevealing = useHandCricketStore((state) => state.isRevealing);
  const moveId = useHandCricketStore((state) => state.currentMove?.id);
  const advanceAfterReveal = useHandCricketStore((state) => state.advanceAfterReveal);

  useEffect(() => {
    if (!isRevealing || !moveId) {
      return;
    }

    const timeoutId = window.setTimeout(advanceAfterReveal, 1100);
    return () => window.clearTimeout(timeoutId);
  }, [advanceAfterReveal, isRevealing, moveId]);
}
