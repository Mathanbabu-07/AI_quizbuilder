"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hand, ThumbsUp, Zap } from "lucide-react";
import type { HandCricketMove } from "@/app/games/hand-cricket/store/handCricketStore";

type HandRevealProps = {
  move: HandCricketMove | null;
  message: string;
};

function FingerGesture({ value, isPlayer }: { value: number | null; isPlayer: boolean }) {
  if (!value) {
    return <Hand className={`size-14 sm:size-24 ${isPlayer ? "-rotate-12" : "rotate-12 scale-x-[-1]"}`} strokeWidth={1.35} />;
  }

  if (value === 6) {
    return <ThumbsUp className={`size-14 sm:size-24 ${isPlayer ? "-rotate-12" : "rotate-12 scale-x-[-1]"}`} strokeWidth={1.35} />;
  }

  return (
    <div className="relative flex h-16 w-20 items-end justify-center gap-1.5 sm:h-24 sm:w-28 sm:gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < value;
        return (
          <motion.span
            key={index}
            className={`block w-2 rounded-full border border-current sm:w-3 ${active ? "bg-current/20 opacity-95" : "bg-white/0 opacity-16"}`}
            style={{ height: `${active ? 34 + index * 5 : 18}px`, transform: `rotate(${(index - 2) * 5}deg)` }}
            animate={active ? { y: [3, -2, 0], scaleY: [0.88, 1.08, 1] } : false}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
      <span className="absolute bottom-0 h-8 w-14 rounded-b-2xl rounded-t-lg border border-current bg-current/10 opacity-80 sm:h-10 sm:w-20" />
    </div>
  );
}

function HologramHand({
  side,
  value,
  moveId,
  danger
}: {
  side: "player" | "ai";
  value: number | null;
  moveId: number;
  danger: boolean;
}) {
  const isPlayer = side === "player";
  const colorClass = isPlayer
    ? "border-cyan-100/24 bg-cyan-100/10 text-cyan-50 shadow-[0_0_42px_rgba(34,211,238,0.24)]"
    : "border-rose-100/24 bg-rose-100/10 text-rose-50 shadow-[0_0_42px_rgba(244,63,94,0.22)]";
  const fromX = isPlayer ? -82 : 82;

  return (
    <motion.div
      key={`${side}-${moveId}`}
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, x: fromX, scale: 0.86, rotate: isPlayer ? -8 : 8 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className={`relative grid size-24 place-items-center rounded-2xl border backdrop-blur-xl sm:size-44 sm:rounded-[2rem] ${colorClass}`}>
        <span className="absolute inset-x-5 top-0 h-px bg-white/70 opacity-60 sm:inset-x-8" />
        <motion.span
          className="absolute inset-3 rounded-xl border border-current opacity-20 sm:inset-4 sm:rounded-[1.5rem]"
          animate={{ scale: danger ? [1, 1.08, 1] : [1, 1.04, 1], opacity: danger ? [0.16, 0.36, 0.16] : [0.12, 0.28, 0.12] }}
          transition={{ duration: danger ? 0.58 : 2.8, repeat: danger ? 1 : Infinity, ease: "easeInOut" }}
        />
        <FingerGesture value={value} isPlayer={isPlayer} />
        <motion.span
          className="absolute -bottom-4 grid size-11 place-items-center rounded-full border border-white/18 bg-slate-950/88 font-display text-xl font-extrabold text-white shadow-[0_0_22px_rgba(255,255,255,0.14)] sm:-bottom-5 sm:size-16 sm:text-3xl sm:shadow-[0_0_28px_rgba(255,255,255,0.16)]"
          animate={{ scale: value ? [0.9, 1.12, 1] : 1 }}
          transition={{ duration: 0.38 }}
        >
          {value ?? "?"}
        </motion.span>
      </div>
      <p className="mt-5 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-white/52 sm:mt-8 sm:text-xs sm:tracking-[0.2em]">
        {isPlayer ? "Player" : "AI"}
      </p>
    </motion.div>
  );
}

export const HandReveal = memo(function HandReveal({ move, message }: HandRevealProps) {
  const isOut = move?.outcome === "out";
  const runsLabel = move ? (isOut ? "OUT" : `+${move.runs} RUN${move.runs === 1 ? "" : "S"}`) : "READY";
  const isPowerHit = move?.intensity === "six" || move?.intensity === "four";

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-3 sm:gap-6">
      <div className="relative grid w-full grid-cols-[1fr_4rem_1fr] items-center gap-1.5 sm:grid-cols-[1fr_8rem_1fr] sm:gap-6">
        <HologramHand side="player" value={move?.playerPick ?? null} moveId={move?.id ?? 0} danger={Boolean(isOut)} />

        <div className="relative grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={move?.id ?? "ready"}
              className={`grid size-16 place-items-center rounded-full border font-display text-[0.72rem] font-extrabold uppercase tracking-[0.1em] sm:size-28 sm:text-lg sm:tracking-[0.12em] ${
                isOut
                  ? "border-rose-100/36 bg-rose-500/18 text-rose-50 shadow-[0_0_42px_rgba(244,63,94,0.28)]"
                  : "border-cyan-100/28 bg-cyan-100/10 text-cyan-50 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
              }`}
              initial={{ opacity: 0, scale: 0.62, rotate: -14 }}
              animate={{ opacity: 1, scale: isPowerHit ? [1, 1.16, 1] : 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {runsLabel}
            </motion.div>
          </AnimatePresence>

          {move ? (
            <motion.span
              key={`pulse-${move.id}`}
              className={`absolute size-20 rounded-full border sm:size-36 ${isOut ? "border-rose-100/35" : "border-cyan-100/30"}`}
              initial={{ scale: 0.45, opacity: 0.5 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ) : null}
          <Zap className="absolute -bottom-6 size-4 text-white/34 sm:-bottom-9 sm:size-5" strokeWidth={1.7} />
        </div>

        <HologramHand side="ai" value={move?.aiPick ?? null} moveId={move?.id ?? 0} danger={Boolean(isOut)} />
      </div>

      <motion.p
        key={message}
        className={`min-h-9 rounded-xl border px-3 py-2 text-center font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] backdrop-blur-xl sm:min-h-12 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base sm:tracking-[0.16em] ${
          isOut
            ? "border-rose-100/24 bg-rose-500/12 text-rose-50"
            : "border-white/12 bg-white/[0.06] text-white/72"
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {message}
      </motion.p>
    </div>
  );
});
