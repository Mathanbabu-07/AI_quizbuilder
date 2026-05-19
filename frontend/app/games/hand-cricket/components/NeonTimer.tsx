"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { MOVE_SECONDS } from "@/app/games/hand-cricket/store/handCricketStore";

type NeonTimerProps = {
  timer: number;
  isRevealing: boolean;
};

export const NeonTimer = memo(function NeonTimer({ timer, isRevealing }: NeonTimerProps) {
  const progress = Math.max(0, Math.min(1, timer / MOVE_SECONDS));
  const degrees = Math.round(progress * 360);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <motion.div
        className="relative grid size-16 place-items-center rounded-full border border-white/16 bg-slate-950/54 shadow-[0_0_24px_rgba(34,211,238,0.18)] sm:size-24 sm:shadow-[0_0_34px_rgba(34,211,238,0.2)]"
        style={{
          background: `conic-gradient(rgba(103,232,249,0.92) ${degrees}deg, rgba(255,255,255,0.13) ${degrees}deg)`
        }}
        animate={isRevealing ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.34 }}
      >
        <span className="absolute inset-[5px] rounded-full bg-slate-950/92 sm:inset-[7px]" />
        <span className="relative font-display text-2xl font-extrabold text-white sm:text-3xl">
          {isRevealing ? "!" : timer}
        </span>
      </motion.div>
      <p className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-center text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/58 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]">
        {isRevealing ? "Revealing move" : "Pick before the timer ends"}
      </p>
    </div>
  );
});
