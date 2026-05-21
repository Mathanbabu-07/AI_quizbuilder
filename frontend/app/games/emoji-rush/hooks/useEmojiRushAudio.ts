"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEmojiRushStore } from "@/app/games/emoji-rush/store/emojiRushStore";

const SOUND_SRC = {
  match: "/games/emoji-rush/sounds/match.aac",
  roundClear: "/games/emoji-rush/sounds/round_clear.aac",
  goldMedal: "/games/emoji-rush/sounds/gold_medal.aac"
};

export function useEmojiRushAudio() {
  const soundCue = useEmojiRushStore((state) => state.soundCue);
  const lastRoundResult = useEmojiRushStore((state) => state.lastRoundResult);
  const phase = useEmojiRushStore((state) => state.phase);
  const medal = useEmojiRushStore((state) => state.medal);
  const playedCueIds = useRef(new Set<string>());
  const playedRoundIds = useRef(new Set<string>());
  const playedGoldKey = useRef<string | null>(null);

  const playSound = useCallback((src: string, volume = 0.72) => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio(src);
    audio.volume = volume;
    audio.preload = "auto";
    void audio.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!soundCue || playedCueIds.current.has(soundCue.id)) {
      return;
    }

    playedCueIds.current.add(soundCue.id);
    playSound(SOUND_SRC.match, 0.58);
  }, [playSound, soundCue]);

  useEffect(() => {
    if (!lastRoundResult?.completed || playedRoundIds.current.has(lastRoundResult.id)) {
      return;
    }

    playedRoundIds.current.add(lastRoundResult.id);
    playSound(SOUND_SRC.roundClear, 0.74);
  }, [lastRoundResult, playSound]);

  useEffect(() => {
    const goldKey = `${phase}:${medal}`;
    if (phase !== "game-over" || medal !== "gold" || playedGoldKey.current === goldKey) {
      return;
    }

    playedGoldKey.current = goldKey;
    playSound(SOUND_SRC.goldMedal, 0.84);
  }, [medal, phase, playSound]);
}
