"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import type { MatchResult } from "@/app/games/hand-cricket/store/handCricketStore";

type ResultCardProps = {
  result: MatchResult;
  playerScore: number;
  aiScore: number;
  onTryAgain: () => void;
};

const resultCopy: Record<MatchResult, { title: string; tone: string; glow: string }> = {
  win: {
    title: "YOU WON",
    tone: "text-emerald-50 border-emerald-100/28 bg-emerald-500/14",
    glow: "bg-emerald-300/20"
  },
  lose: {
    title: "YOU LOST",
    tone: "text-rose-50 border-rose-100/28 bg-rose-500/14",
    glow: "bg-rose-300/18"
  },
  draw: {
    title: "DRAW",
    tone: "text-cyan-50 border-cyan-100/28 bg-cyan-500/14",
    glow: "bg-cyan-300/18"
  }
};

export const ResultCard = memo(function ResultCard({ result, playerScore, aiScore, onTryAgain }: ResultCardProps) {
  const copy = resultCopy[result];

  return (
    <motion.div
      className="mx-auto flex min-h-[60dvh] w-full max-w-2xl items-center justify-center"
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`relative w-full overflow-hidden rounded-[2rem] border p-6 text-center shadow-[0_28px_88px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8 ${copy.tone}`}>
        <div className={`absolute left-1/2 top-0 -z-10 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full ${copy.glow}`} />
        <motion.div
          className="mx-auto grid size-20 place-items-center rounded-full border border-white/18 bg-white/[0.08] text-white shadow-[0_0_34px_rgba(255,255,255,0.12)]"
          animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="size-9" strokeWidth={1.6} />
        </motion.div>
        <h1 className="mt-6 font-display text-5xl font-extrabold uppercase tracking-wide text-white sm:text-7xl">
          {copy.title}
        </h1>
        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
          <div className="rounded-2xl border border-cyan-100/18 bg-cyan-100/8 p-4">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100/62">Player</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">{playerScore}</p>
          </div>
          <div className="rounded-2xl border border-rose-100/18 bg-rose-100/8 p-4">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-rose-100/62">AI</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">{aiScore}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={onTryAgain}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-100/28 bg-cyan-100/12 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-white outline-none transition-colors duration-300 hover:border-cyan-100/60 hover:bg-cyan-100/18 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw className="size-4" />
            Try Again
          </motion.button>
          <Link
            href="/?view=moreGames"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.07] font-display text-sm font-extrabold uppercase tracking-[0.14em] text-white/78 outline-none transition-colors duration-300 hover:border-white/34 hover:bg-white/[0.1] hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <ArrowLeft className="size-4" />
            More Games
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
