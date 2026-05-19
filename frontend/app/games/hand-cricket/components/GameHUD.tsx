"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Hand, Shield, Swords } from "lucide-react";
import { HandReveal } from "@/app/games/hand-cricket/components/HandReveal";
import { NeonTimer } from "@/app/games/hand-cricket/components/NeonTimer";
import { NumberPad } from "@/app/games/hand-cricket/components/NumberPad";
import { ResultCard } from "@/app/games/hand-cricket/components/ResultCard";
import { ScoreBoard } from "@/app/games/hand-cricket/components/ScoreBoard";
import type { PlayerSide } from "@/app/games/hand-cricket/store/handCricketStore";
import { useHandCricketStore } from "@/app/games/hand-cricket/store/handCricketStore";

function SideCard({
  side,
  title,
  subtitle,
  onSelect
}: {
  side: PlayerSide;
  title: string;
  subtitle: string;
  onSelect: (side: PlayerSide) => void;
}) {
  const Icon = side === "bat" ? Swords : Shield;
  const tone =
    side === "bat"
      ? "border-cyan-100/26 bg-cyan-100/10 text-cyan-50 shadow-[0_0_42px_rgba(34,211,238,0.18)]"
      : "border-emerald-100/26 bg-emerald-100/10 text-emerald-50 shadow-[0_0_42px_rgba(16,185,129,0.16)]";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(side)}
      className={`group relative isolate min-h-56 overflow-hidden rounded-[2rem] border p-6 text-left outline-none backdrop-blur-2xl transition-colors duration-300 hover:border-white/54 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${tone}`}
      whileHover={{ y: -8, scale: 1.018 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
    >
      <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="grid size-16 place-items-center rounded-2xl border border-white/14 bg-white/[0.08]">
        <Icon className="size-8" strokeWidth={1.6} />
      </span>
      <h2 className="mt-8 font-display text-4xl font-extrabold uppercase text-white">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-white/54">{subtitle}</p>
      <Hand className="absolute bottom-5 right-5 size-16 opacity-20 transition-transform duration-300 group-hover:-rotate-12" strokeWidth={1.3} />
    </motion.button>
  );
}

function ChooseSide({ onSelect }: { onSelect: (side: PlayerSide) => void }) {
  return (
    <motion.div
      className="mx-auto flex min-h-[62dvh] w-full max-w-5xl flex-col justify-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center">
        <p className="font-display text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-100/76">
          Solo Cricket Arena
        </p>
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase text-white sm:text-7xl">
          Choose Your Side
        </h1>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <SideCard side="bat" title="BAT" subtitle="Set the target in six balls or until you are out." onSelect={onSelect} />
        <SideCard side="bowl" title="BOWL" subtitle="AI bats first. Match its number to end the innings." onSelect={onSelect} />
      </div>
    </motion.div>
  );
}

export const GameHUD = memo(function GameHUD() {
  const status = useHandCricketStore((state) => state.status);
  const chooseSide = useHandCricketStore((state) => state.chooseSide);
  const playMove = useHandCricketStore((state) => state.playMove);
  const resetMatch = useHandCricketStore((state) => state.resetMatch);
  const playerScore = useHandCricketStore((state) => state.playerScore);
  const aiScore = useHandCricketStore((state) => state.aiScore);
  const ballsRemaining = useHandCricketStore((state) => state.ballsRemaining);
  const target = useHandCricketStore((state) => state.target);
  const innings = useHandCricketStore((state) => state.innings);
  const batting = useHandCricketStore((state) => state.batting);
  const timer = useHandCricketStore((state) => state.timer);
  const currentMove = useHandCricketStore((state) => state.currentMove);
  const message = useHandCricketStore((state) => state.message);
  const isRevealing = useHandCricketStore((state) => state.isRevealing);
  const result = useHandCricketStore((state) => state.result);
  const disabled = status !== "playing" || isRevealing;

  const handlePick = useCallback((value: number) => playMove(value), [playMove]);

  return (
    <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/?view=moreGames"
          className="group inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.07] px-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-white/74 outline-none backdrop-blur-xl transition-colors duration-300 hover:border-cyan-100/34 hover:bg-cyan-100/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          More Games
        </Link>
        <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-100/16 bg-cyan-100/[0.07] px-4 font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-50/78 backdrop-blur-xl">
          <Bot className="size-4" />
          AI Solo
        </div>
      </header>

      {status === "choose-side" ? (
        <ChooseSide onSelect={chooseSide} />
      ) : status === "result" && result ? (
        <ResultCard result={result} playerScore={playerScore} aiScore={aiScore} onTryAgain={resetMatch} />
      ) : (
        <div className="flex flex-1 flex-col gap-6 pt-5 sm:pt-8">
          <ScoreBoard
            playerScore={playerScore}
            aiScore={aiScore}
            ballsRemaining={ballsRemaining}
            target={target}
            innings={innings}
            batting={batting}
          />
          <main className="grid flex-1 content-center gap-7">
            <HandReveal move={currentMove} message={message} />
            <NeonTimer timer={timer} isRevealing={isRevealing} />
            <NumberPad disabled={disabled} onPick={handlePick} />
          </main>
        </div>
      )}
    </div>
  );
});
