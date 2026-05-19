"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Gauge, Goal, Shield, Swords } from "lucide-react";
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
    <div className={`min-h-20 rounded-2xl border px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl ${accentClass}`}>
      <p className="font-display text-[0.64rem] font-extrabold uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-white">{value}</p>
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
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_1.15fr_0.8fr_0.8fr_1fr]"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <HudTile label="Player Score" value={playerScore} accent="cyan" />
      <HudTile label="AI Score" value={aiScore} accent="red" />
      <HudTile label="Balls" value={`${ballsRemaining}/${MAX_BALLS}`} accent="emerald" />
      <HudTile label="Target" value={target ?? "-"} accent="violet" />
      <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <p className="font-display text-[0.64rem] font-extrabold uppercase tracking-[0.2em] text-white/42">
          Innings {innings}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-display text-sm font-extrabold uppercase text-white">
            {batting === "player" ? <Swords className="size-4 text-cyan-100" /> : <Shield className="size-4 text-rose-100" />}
            {batting === "player" ? "You Bat" : "AI Bats"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white/42">
            <Gauge className="size-3.5" />
            {ballsUsed}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
