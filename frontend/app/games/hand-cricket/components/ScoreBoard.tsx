"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Gauge, Shield, Swords } from "lucide-react";
import { MAX_BALLS, type Batter } from "@/app/games/hand-cricket/store/handCricketStore";

type ScoreBoardProps = {
  playerScore: number;
  aiScore: number;
  ballsRemaining: number;
  target: number | null;
  innings: 1 | 2;
  batting: Batter;
};

function HudTile({ label, value, accent }: { label: string; value: string | number; accent: "cyan" | "red" | "emerald" | "violet" }) {
  const accentClass = {
    cyan: "text-cyan-100 border-cyan-100/22 bg-cyan-100/8",
    emerald: "text-emerald-100 border-emerald-100/22 bg-emerald-100/8",
    red: "text-rose-100 border-rose-100/22 bg-rose-100/8",
    violet: "text-violet-100 border-violet-100/22 bg-violet-100/8"
  }[accent];

  return (
    <div className={`min-h-14 rounded-xl border px-2.5 py-2 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:min-h-20 sm:rounded-2xl sm:px-4 sm:py-3 ${accentClass}`}>
      <p className="font-display text-[0.52rem] font-extrabold uppercase tracking-[0.12em] text-white/42 sm:text-[0.64rem] sm:tracking-[0.2em]">{label}</p>
      <p className="mt-1 font-display text-lg font-extrabold text-white sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

export const ScoreBoard = memo(function ScoreBoard({
  playerScore,
  aiScore,
  ballsRemaining,
  target,
  innings,
  batting
}: ScoreBoardProps) {
  const ballsUsed = MAX_BALLS - ballsRemaining;

  return (
    <motion.div
      className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[1.15fr_1.15fr_0.8fr_0.8fr_1fr]"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <HudTile label="Player Score" value={playerScore} accent="cyan" />
      <HudTile label="AI Score" value={aiScore} accent="red" />
      <HudTile label="Balls" value={`${ballsRemaining}/${MAX_BALLS}`} accent="emerald" />
      <HudTile label="Target" value={target ?? "-"} accent="violet" />
      <div className="col-span-2 rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-2 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:col-span-1 sm:rounded-2xl sm:px-4 sm:py-3">
        <p className="font-display text-[0.52rem] font-extrabold uppercase tracking-[0.12em] text-white/42 sm:text-[0.64rem] sm:tracking-[0.2em]">
          Innings {innings}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 font-display text-[0.68rem] font-extrabold uppercase text-white sm:gap-2 sm:text-sm">
            {batting === "player" ? <Swords className="size-3.5 text-cyan-100 sm:size-4" /> : <Shield className="size-3.5 text-rose-100 sm:size-4" />}
            {batting === "player" ? "You Bat" : "AI Bats"}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-white/42 sm:text-xs">
            <Gauge className="size-3.5" />
            {ballsUsed}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
