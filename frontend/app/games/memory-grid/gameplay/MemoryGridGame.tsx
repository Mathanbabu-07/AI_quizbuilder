"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  Crown,
  Heart,
  HeartCrack,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy
} from "lucide-react";
import { calculateAccuracy } from "@/app/games/memory-grid/game/board";
import { MEMORY_GRID_ROUNDS, MAX_MEMORY_GRID_HEARTS, getMemoryRoundConfig } from "@/app/games/memory-grid/game/config";
import { useMemoryGridBackend } from "@/app/games/memory-grid/hooks/useMemoryGridBackend";
import { useMemoryGridStore, type MemoryGridMedal } from "@/app/games/memory-grid/store/memoryGridStore";

const PixiMemoryGrid = dynamic(
  () => import("@/app/games/memory-grid/components/PixiMemoryGrid").then((module) => module.PixiMemoryGrid),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid place-items-center rounded-xl border border-white/25 bg-slate-950/40 font-display text-xs font-extrabold uppercase tracking-[0.18em] text-white/60"
        style={{ width: "min(94vw, 54svh, 620px)", aspectRatio: "1 / 1" }}
      >
        Loading Grid
      </div>
    )
  }
);

const glassPanel =
  "border border-white/22 bg-slate-950/34 shadow-[0_16px_46px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md";

const actionButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-100/36 bg-[linear-gradient(180deg,rgba(236,254,255,0.96),rgba(103,232,249,0.86)_44%,rgba(45,212,191,0.82))] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.15em] text-slate-950 shadow-[0_10px_24px_rgba(45,212,191,0.24)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function MemoryShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative h-svh overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/games/memory-grid/background.jpg')" }}
      />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,0.12),transparent_36%),linear-gradient(180deg,rgba(2,6,23,0.06),rgba(2,6,23,0.2))]" />
      <div className="relative z-10 h-full">{children}</div>
    </main>
  );
}

function TargetPreview({ cardId }: { cardId: string | null }) {
  const cards = useMemoryGridStore((state) => state.cards);
  const card = cards.find((item) => item.id === cardId) ?? null;

  if (!card) {
    return (
      <div className={`grid h-20 min-w-20 place-items-center rounded-xl ${glassPanel}`}>
        <BrainCircuit className="size-8 text-cyan-100/70" />
      </div>
    );
  }

  return (
    <motion.div
      key={card.id}
      className="relative grid h-20 min-w-20 place-items-center overflow-hidden rounded-xl border border-white/34 shadow-[0_12px_28px_rgba(0,0,0,0.28)] sm:h-24 sm:min-w-24"
      style={{
        background: `linear-gradient(145deg, ${card.asset.css.from}, ${card.asset.css.via} 48%, ${card.asset.css.to})`
      }}
      initial={{ scale: 0.82, rotate: -4, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <span className="absolute inset-x-3 top-2 h-4 rounded-full bg-white/24" />
      <span className="text-4xl drop-shadow-[0_4px_10px_rgba(15,23,42,0.34)] sm:text-5xl">{card.asset.emoji}</span>
    </motion.div>
  );
}

function IntroScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("Player");
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <motion.section
      className="mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_1fr] px-4 py-4 sm:px-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/?view=moreGames"
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-white/86 ${glassPanel}`}
        >
          <ArrowLeft className="size-4" />
          Games
        </Link>
        <div className={`rounded-xl px-4 py-2 font-display text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-cyan-50/84 ${glassPanel}`}>
          Focus Arena
        </div>
      </header>

      <div className="grid min-h-0 place-items-center py-3">
        <div className="grid w-full max-w-4xl gap-4">
          <motion.div
            className={`relative overflow-hidden rounded-2xl p-5 text-center sm:p-7 ${glassPanel}`}
            animate={motionEnabled ? { y: [0, -6, 0] } : undefined}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#67e8f9,#fef08a,#f0abfc,#67e8f9)]" />
            <p className="font-display text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-cyan-100/76">
              GENQUIZ Presents
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-wide text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.42)] sm:text-6xl">
              Memory Grid
            </h1>
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-5 gap-2">
              {["🦊", "🍓", "💎", "🦋", "🚀"].map((item, index) => (
                <motion.span
                  key={item}
                  className="grid aspect-square place-items-center rounded-xl border border-white/24 bg-white/16 text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_10px_22px_rgba(0,0,0,0.24)]"
                  animate={motionEnabled ? { rotateY: [0, 180, 360], y: [0, -5, 0] } : undefined}
                  transition={{ duration: 4.8, delay: index * 0.12, repeat: Infinity, ease: "easeInOut" }}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid grid-cols-5 gap-2">
              {MEMORY_GRID_ROUNDS.map((round) => (
                <div key={round.round} className={`rounded-xl p-2 text-center ${glassPanel}`}>
                  <p className="font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-cyan-100/72">
                    R{round.round}
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-white">
                    {round.cols}x{round.rows}
                  </p>
                  <p className="truncate text-[0.56rem] font-bold uppercase tracking-[0.08em] text-white/58">
                    {round.targetCount} targets
                  </p>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl p-3 ${glassPanel}`}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 24))}
                className="h-11 w-full rounded-xl border border-white/22 bg-white/12 px-4 text-center font-display text-sm font-extrabold uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/42 focus:border-cyan-100/60"
                placeholder="Player"
              />
              <motion.button
                type="button"
                onClick={() => onStart(name)}
                className={`${actionButton} mt-3 h-14 w-full text-sm`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Play className="size-5 fill-slate-950" />
                Start Game
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeartMeter() {
  const hearts = useMemoryGridStore((state) => state.hearts);
  const lastHeartEvent = useMemoryGridStore((state) => state.lastHeartEvent);

  return (
    <div className={`flex h-11 items-center gap-1.5 rounded-xl px-2.5 ${glassPanel}`} aria-label={`${hearts} hearts left`}>
      {Array.from({ length: MAX_MEMORY_GRID_HEARTS }).map((_, index) => {
        const active = index < hearts;
        const justLost = lastHeartEvent && index === hearts;
        return (
          <motion.span
            key={index}
            className="relative grid size-8 place-items-center"
            animate={justLost ? { scale: [1, 1.22, 0.88, 1], rotate: [0, -8, 8, 0] } : active ? { scale: [1, 1.08, 1] } : undefined}
            transition={active ? { duration: 1.5, repeat: Infinity, delay: index * 0.12 } : { duration: 0.44 }}
          >
            {active ? (
              <Heart className="size-6 fill-rose-500 text-rose-200 drop-shadow-[0_0_12px_rgba(244,63,94,0.72)]" />
            ) : (
              <HeartCrack className="size-6 text-rose-200/40" />
            )}
            {justLost ? (
              <>
                <motion.span
                  className="absolute left-1 top-1 size-1.5 rounded-full bg-rose-200"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: -10, y: -8, opacity: 0 }}
                  transition={{ duration: 0.42 }}
                />
                <motion.span
                  className="absolute right-1 top-2 size-1.5 rounded-full bg-rose-100"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: 10, y: -5, opacity: 0 }}
                  transition={{ duration: 0.42 }}
                />
              </>
            ) : null}
          </motion.span>
        );
      })}
    </div>
  );
}

function TimerPill() {
  const phase = useMemoryGridStore((state) => state.phase);
  const memorizeLeft = useMemoryGridStore((state) => state.memorizeLeft);
  const findLeft = useMemoryGridStore((state) => state.findLeft);
  const value = phase === "memorize" ? memorizeLeft : findLeft;
  const label = phase === "memorize" ? "Memorize" : "Find";

  return (
    <div className={`flex h-11 items-center gap-2 rounded-xl px-3 ${glassPanel}`}>
      <motion.span
        className="grid size-7 place-items-center rounded-full bg-cyan-100/14 text-cyan-50 shadow-[0_0_18px_rgba(103,232,249,0.3)]"
        animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 10px rgba(103,232,249,0.18)", "0 0 24px rgba(103,232,249,0.44)", "0 0 10px rgba(103,232,249,0.18)"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <Timer className="size-4" />
      </motion.span>
      <div className="min-w-0">
        <p className="font-display text-[0.54rem] font-extrabold uppercase tracking-[0.16em] text-cyan-100/62">
          {label}
        </p>
        <motion.p
          key={`${phase}-${value}`}
          className="font-display text-lg font-extrabold leading-none text-white"
          initial={{ y: -5, opacity: 0.2 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.16 }}
        >
          {value}s
        </motion.p>
      </div>
    </div>
  );
}

function GameHud() {
  const phase = useMemoryGridStore((state) => state.phase);
  const round = useMemoryGridStore((state) => state.round);
  const totalScore = useMemoryGridStore((state) => state.totalScore);
  const targetIndex = useMemoryGridStore((state) => state.targetIndex);
  const backendStatus = useMemoryGridStore((state) => state.backendStatus);
  const pauseGame = useMemoryGridStore((state) => state.pauseGame);
  const resumeGame = useMemoryGridStore((state) => state.resumeGame);
  const config = getMemoryRoundConfig(round);

  return (
    <header className="mx-auto grid w-full max-w-6xl gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/?view=moreGames"
          className={`grid size-10 place-items-center rounded-xl text-white/90 ${glassPanel}`}
          aria-label="Back to games"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-center ${glassPanel}`}>
          <p className="truncate font-display text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-cyan-100/78">
            R{round} {config.title}
          </p>
          <p className="mt-0.5 font-display text-sm font-extrabold text-white">
            {targetIndex}/{config.targetCount} targets · {totalScore} pts · {backendStatus}
          </p>
        </div>
        <button
          type="button"
          onClick={phase === "paused" ? resumeGame : pauseGame}
          className={`grid size-10 place-items-center rounded-xl text-white/90 ${glassPanel}`}
          aria-label={phase === "paused" ? "Resume game" : "Pause game"}
        >
          {phase === "paused" ? <Play className="size-5 fill-white" /> : <Pause className="size-5 fill-white" />}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <HeartMeter />
        <TimerPill />
      </div>
    </header>
  );
}

function TargetDock() {
  const phase = useMemoryGridStore((state) => state.phase);
  const targetQueue = useMemoryGridStore((state) => state.targetQueue);
  const targetIndex = useMemoryGridStore((state) => state.targetIndex);
  const combo = useMemoryGridStore((state) => state.combo);
  const backendMessage = useMemoryGridStore((state) => state.backendMessage);
  const currentTarget = phase === "find" ? targetQueue[targetIndex] ?? null : null;
  const label = phase === "memorize" ? "Memorize the grid" : phase === "find" ? "Find this image" : backendMessage || "Memory Grid";

  return (
    <footer className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-3 sm:px-6 sm:pb-4">
      <TargetPreview cardId={currentTarget} />
      <div className={`min-w-0 rounded-xl px-3 py-3 ${glassPanel}`}>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${phase}-${targetIndex}-${backendMessage}`}
            className="truncate font-display text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-50/86 sm:text-sm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 truncate text-[0.68rem] font-semibold text-white/56 sm:text-xs">
          {phase === "memorize" ? "Images hide when the countdown ends." : backendMessage || "Trust your recall."}
        </p>
      </div>
      <motion.div
        className={`grid h-20 min-w-16 place-items-center rounded-xl px-2 text-center sm:h-24 sm:min-w-20 ${glassPanel}`}
        animate={combo > 1 ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 0.34 }}
      >
        <p className="font-display text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-cyan-100/62">Combo</p>
        <p className="font-display text-2xl font-extrabold text-white">x{combo}</p>
      </motion.div>
    </footer>
  );
}

function RoundCompleteOverlay() {
  const round = useMemoryGridStore((state) => state.round);
  const roundScore = useMemoryGridStore((state) => state.roundScore);

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-slate-950/20 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center ${glassPanel}`}
        initial={{ scale: 0.86, y: 22 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#67e8f9,#fef08a,#f0abfc)]" />
        <motion.div
          className="mx-auto grid size-20 place-items-center rounded-full border border-cyan-100/34 bg-cyan-100/16 text-cyan-50 shadow-[0_0_38px_rgba(103,232,249,0.32)]"
          animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-10" />
        </motion.div>
        <p className="mt-5 font-display text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100/76">
          Round {round} Clear
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-white">Focus Locked</h2>
        <p className="mt-3 font-display text-2xl font-extrabold text-cyan-50">{roundScore} pts</p>
      </motion.div>
    </motion.div>
  );
}

function PauseOverlay() {
  const resumeGame = useMemoryGridStore((state) => state.resumeGame);

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.button
        type="button"
        onClick={resumeGame}
        className={`${actionButton} h-16 px-8 text-base`}
        initial={{ scale: 0.88 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.97 }}
      >
        <Play className="size-6 fill-slate-950" />
        Resume
      </motion.button>
    </motion.div>
  );
}

function medalLabel(medal: MemoryGridMedal, victory: boolean) {
  if (victory) {
    return "Victory";
  }
  if (medal === "gold") {
    return "Gold Medal";
  }
  if (medal === "silver") {
    return "Silver Medal";
  }
  if (medal === "bronze") {
    return "Bronze Medal";
  }
  return "Game Over";
}

function EndScreen({ victory }: { victory: boolean }) {
  const medal = useMemoryGridStore((state) => state.medal);
  const totalScore = useMemoryGridStore((state) => state.totalScore);
  const completedRounds = useMemoryGridStore((state) => state.completedRounds);
  const correctSelections = useMemoryGridStore((state) => state.correctSelections);
  const wrongSelections = useMemoryGridStore((state) => state.wrongSelections);
  const restartGame = useMemoryGridStore((state) => state.restartGame);
  const accuracy = calculateAccuracy(correctSelections, wrongSelections);
  const confetti = useMemo(() => Array.from({ length: victory ? 34 : 16 }), [victory]);

  return (
    <motion.section
      className="relative mx-auto grid h-full w-full max-w-6xl grid-rows-[auto_1fr] overflow-hidden px-4 py-4 sm:px-6"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="flex items-center justify-between">
        <Link
          href="/?view=moreGames"
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-white/86 ${glassPanel}`}
        >
          <ArrowLeft className="size-4" />
          Games
        </Link>
        <button
          type="button"
          onClick={restartGame}
          className={`grid size-10 place-items-center rounded-xl text-white/90 ${glassPanel}`}
          aria-label="Restart Memory Grid"
        >
          <RotateCcw className="size-5" />
        </button>
      </header>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((_, index) => (
          <motion.span
            key={index}
            className="absolute size-2 rounded-sm"
            style={{
              left: `${(index * 31) % 100}%`,
              top: "-8%",
              backgroundColor: index % 3 === 0 ? "#67e8f9" : index % 3 === 1 ? "#fef08a" : "#f0abfc"
            }}
            animate={{ y: ["0svh", "112svh"], rotate: [0, 240, 540], opacity: [0, 1, 0] }}
            transition={{ duration: 3.4 + (index % 7) * 0.28, delay: (index % 8) * 0.18, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="grid min-h-0 place-items-center py-4">
        <div className={`relative w-full max-w-xl overflow-hidden rounded-2xl p-6 text-center sm:p-8 ${glassPanel}`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#67e8f9,#fef08a,#f0abfc)]" />
          <motion.div
            className="mx-auto grid size-28 place-items-center rounded-full border border-cyan-100/38 bg-cyan-100/16 text-cyan-50 shadow-[0_0_42px_rgba(103,232,249,0.34)]"
            animate={{ y: [0, -8, 0], rotate: victory ? [0, 4, -4, 0] : 0 }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          >
            {victory ? <Crown className="size-16 fill-amber-200 text-amber-200" /> : <Trophy className="size-16 text-cyan-100/82" />}
          </motion.div>
          <p className="mt-6 font-display text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-100/76">
            Memory Grid
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase text-white sm:text-5xl">
            {medalLabel(medal, victory)}
          </h1>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-white/18 bg-white/10 p-3">
              <p className="font-display text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-white/58">Score</p>
              <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{totalScore}</p>
            </div>
            <div className="rounded-xl border border-white/18 bg-white/10 p-3">
              <p className="font-display text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-white/58">Rounds</p>
              <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{completedRounds}/5</p>
            </div>
            <div className="rounded-xl border border-white/18 bg-white/10 p-3">
              <p className="font-display text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-white/58">Accuracy</p>
              <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{accuracy}%</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={restartGame}
            className={`${actionButton} mt-6`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw className="size-5" />
            Replay
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

function GamePlayScreen() {
  const phase = useMemoryGridStore((state) => state.phase);
  const tick = useMemoryGridStore((state) => state.tick);
  const clearEffects = useMemoryGridStore((state) => state.clearEffects);
  const continueNextRound = useMemoryGridStore((state) => state.continueNextRound);

  useEffect(() => {
    const timer = window.setInterval(() => {
      tick();
    }, 1000);
    const fxTimer = window.setInterval(() => {
      clearEffects();
    }, 240);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(fxTimer);
    };
  }, [clearEffects, tick]);

  useEffect(() => {
    if (phase !== "round-complete") {
      return;
    }
    const timer = window.setTimeout(() => {
      continueNextRound();
    }, 1850);
    return () => window.clearTimeout(timer);
  }, [continueNextRound, phase]);

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden">
      <GameHud />
      <div className="grid min-h-0 place-items-center px-2 py-2">
        <PixiMemoryGrid />
      </div>
      <TargetDock />

      <AnimatePresence>{phase === "round-complete" ? <RoundCompleteOverlay /> : null}</AnimatePresence>
      <AnimatePresence>{phase === "paused" ? <PauseOverlay /> : null}</AnimatePresence>
    </div>
  );
}

export function MemoryGridGame() {
  const phase = useMemoryGridStore((state) => state.phase);
  const { startSecureGame } = useMemoryGridBackend();

  return (
    <MemoryShell>
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <IntroScreen key="intro" onStart={startSecureGame} />
        ) : phase === "game-over" ? (
          <EndScreen key="game-over" victory={false} />
        ) : phase === "victory" ? (
          <EndScreen key="victory" victory />
        ) : (
          <GamePlayScreen key="play" />
        )}
      </AnimatePresence>
    </MemoryShell>
  );
}
