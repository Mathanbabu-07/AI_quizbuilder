"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hand, Zap } from "lucide-react";
import type { HandCricketMove } from "@/app/games/hand-cricket/store/handCricketStore";

type HandRevealProps = {
  move: HandCricketMove | null;
  message: string;
};

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
      <div className={`relative grid size-36 place-items-center rounded-[2rem] border backdrop-blur-xl sm:size-44 ${colorClass}`}>
        <span className="absolute inset-x-8 top-0 h-px bg-white/70 opacity-60" />
        <motion.span
          className="absolute inset-4 rounded-[1.5rem] border border-current opacity-20"
          animate={{ scale: danger ? [1, 1.08, 1] : [1, 1.04, 1], opacity: danger ? [0.16, 0.36, 0.16] : [0.12, 0.28, 0.12] }}
          transition={{ duration: danger ? 0.58 : 2.8, repeat: danger ? 1 : Infinity, ease: "easeInOut" }}
        />
        <Hand
          className={`size-20 drop-shadow-[0_0_18px_currentColor] sm:size-24 ${isPlayer ? "-rotate-12" : "rotate-12 scale-x-[-1]"}`}
          strokeWidth={1.35}
        />
        <motion.span
          className="absolute -bottom-5 grid size-16 place-items-center rounded-full border border-white/18 bg-slate-950/88 font-display text-3xl font-extrabold text-white shadow-[0_0_28px_rgba(255,255,255,0.16)]"
          animate={{ scale: value ? [0.9, 1.12, 1] : 1 }}
          transition={{ duration: 0.38 }}
        >
          {value ?? "?"}
        </motion.span>
      </div>
      <p className="mt-8 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-white/52">
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
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
      <div className="relative grid w-full grid-cols-[1fr_5rem_1fr] items-center gap-2 sm:grid-cols-[1fr_8rem_1fr] sm:gap-6">
        <HologramHand side="player" value={move?.playerPick ?? null} moveId={move?.id ?? 0} danger={Boolean(isOut)} />

        <div className="relative grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={move?.id ?? "ready"}
              className={`grid size-20 place-items-center rounded-full border font-display text-sm font-extrabold uppercase tracking-[0.12em] sm:size-28 sm:text-lg ${
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
              className={`absolute size-24 rounded-full border sm:size-36 ${isOut ? "border-rose-100/35" : "border-cyan-100/30"}`}
              initial={{ scale: 0.45, opacity: 0.5 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ) : null}
          <Zap className="absolute -bottom-9 size-5 text-white/34" strokeWidth={1.7} />
        </div>

        <HologramHand side="ai" value={move?.aiPick ?? null} moveId={move?.id ?? 0} danger={Boolean(isOut)} />
      </div>

      <motion.p
        key={message}
        className={`min-h-12 rounded-2xl border px-5 py-3 text-center font-display text-sm font-extrabold uppercase tracking-[0.16em] backdrop-blur-xl sm:text-base ${
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
