"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Crown, Pause, Play, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";
import { ROUND_CONFIGS, getRoundConfig } from "@/app/games/emoji-rush/game/config";
import { useEmojiRushAudio } from "@/app/games/emoji-rush/hooks/useEmojiRushAudio";
import { useEmojiRushBackend } from "@/app/games/emoji-rush/hooks/useEmojiRushBackend";
import { useEmojiRushStore, type EmojiRushMedal } from "@/app/games/emoji-rush/store/emojiRushStore";

const PixiBoard = dynamic(
  () => import("@/app/games/emoji-rush/components/PixiBoard").then((module) => module.PixiBoard),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid aspect-square place-items-center rounded-[1.35rem] border-[3px] border-white/45 bg-[#44335e] font-display text-sm font-extrabold uppercase tracking-[0.2em] text-white/70"
        style={{ width: "min(94vw, 66svh, 620px)", height: "min(94vw, 66svh, 620px)" }}
      >
        Loading Board
      </div>
    )
  }
);

const candyButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/45 bg-[linear-gradient(180deg,#fff59f_0%,#ffb02e_42%,#ff5c7b_100%)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.14em] text-[#6e1739] shadow-[0_9px_0_rgba(129,32,54,0.55),0_18px_32px_rgba(115,23,52,0.24)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#d73358]";

function CandyShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative h-svh overflow-hidden bg-[#d73358] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/games/emoji-rush/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(181,29,68,0.42),rgba(255,103,65,0.16)_48%,rgba(110,28,78,0.28))]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent)]" />
      <div className="relative z-10 h-full">{children}</div>
    </main>
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
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/40 bg-[#731d3a]/55 px-4 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_18px_rgba(70,13,38,0.25)] backdrop-blur-md"
        >
          <ArrowLeft className="size-4" />
          Games
        </Link>
        <div className="rounded-full border border-white/45 bg-[#731d3a]/55 px-4 py-2 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#ffe9a8] shadow-[0_8px_18px_rgba(70,13,38,0.25)] backdrop-blur-md">
          Arcade Arena
        </div>
      </header>

      <div className="grid min-h-0 place-items-center py-3">
        <div className="grid w-full max-w-4xl gap-4 sm:gap-5">
          <motion.div
            className="relative overflow-hidden rounded-[2rem] border border-white/38 bg-[#7b1736]/78 p-5 text-center shadow-[0_20px_60px_rgba(93,12,45,0.36)] backdrop-blur-md sm:p-8"
            animate={motionEnabled ? { y: [0, -6, 0] } : undefined}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#ffec8b,#ff71bd,#7de8ff,#ffec8b)]" />
            <div className="absolute -left-12 top-10 size-28 rounded-full bg-[#ffdd5f]/24 blur-2xl" />
            <div className="absolute -right-14 bottom-4 size-32 rounded-full bg-[#66e9ff]/22 blur-2xl" />
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.28em] text-[#ffe9a8]">
              GENQUIZ Presents
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold uppercase text-white drop-shadow-[0_7px_0_rgba(100,17,52,0.48)] sm:text-7xl">
              Emoji Rush
            </h1>
            <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2">
              {["🍓", "🍬", "💎"].map((emoji) => (
                <span
                  key={emoji}
                  className="grid aspect-square place-items-center rounded-3xl border border-white/45 bg-white/18 text-4xl shadow-[inset_0_2px_0_rgba(255,255,255,0.28),0_12px_20px_rgba(95,21,53,0.24)]"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid grid-cols-5 gap-2">
              {ROUND_CONFIGS.map((round) => (
                <div
                  key={round.round}
                  className="rounded-2xl border border-white/34 bg-white/18 p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_22px_rgba(95,21,53,0.22)] backdrop-blur-md"
                >
                  <p className="font-display text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-[#ffe9a8]">
                    R{round.round}
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-white">{round.targetPoints}</p>
                  <p className="truncate text-[0.58rem] font-bold uppercase tracking-[0.08em] text-white/72">
                    {round.difficulty}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-white/34 bg-[#731d3a]/62 p-3 shadow-[0_14px_32px_rgba(95,21,53,0.24)] backdrop-blur-md">
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 24))}
                className="h-11 w-full rounded-full border border-white/34 bg-white/18 px-4 text-center font-display text-sm font-extrabold uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/52 focus:border-[#ffe9a8]"
                placeholder="Player"
              />
              <motion.button
                type="button"
                onClick={() => onStart(name)}
                className={`${candyButton} mt-3 h-14 w-full text-sm`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 6, scale: 0.98 }}
              >
                <Play className="size-5 fill-[#6e1739]" />
                Start Game
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function StarMeter({ value, target }: { value: number; target: number }) {
  const progress = Math.max(0, Math.min(1, value / target));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="relative h-3 min-w-24 flex-1 overflow-hidden rounded-full border border-[#ffe9a8]/70 bg-[#5f1734]/72">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#ffec8b,#ff9d30,#ff5c9f)]"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        />
      </div>
      {[0, 1, 2].map((index) => (
        <Star
          key={index}
          className={`size-5 ${progress >= (index + 1) / 3 ? "fill-[#ffe45f] text-[#ffe45f]" : "text-[#ffb9bf]/58"}`}
        />
      ))}
    </div>
  );
}

function GameHud() {
  const phase = useEmojiRushStore((state) => state.phase);
  const round = useEmojiRushStore((state) => state.round);
  const totalScore = useEmojiRushStore((state) => state.totalScore);
  const roundScore = useEmojiRushStore((state) => state.roundScore);
  const movesLeft = useEmojiRushStore((state) => state.movesLeft);
  const timeLeft = useEmojiRushStore((state) => state.timeLeft);
  const combo = useEmojiRushStore((state) => state.combo);
  const backendStatus = useEmojiRushStore((state) => state.backendStatus);
  const pauseGame = useEmojiRushStore((state) => state.pauseGame);
  const resumeGame = useEmojiRushStore((state) => state.resumeGame);
  const config = getRoundConfig(round);

  return (
    <header className="mx-auto grid w-full max-w-5xl gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/?view=moreGames"
          className="grid size-10 place-items-center rounded-full border border-white/40 bg-[#731d3a]/62 text-white shadow-[0_8px_18px_rgba(70,13,38,0.24)] backdrop-blur-md"
          aria-label="Back to games"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="rounded-full border border-white/40 bg-[#731d3a]/62 px-3 py-2 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#ffe9a8] shadow-[0_8px_18px_rgba(70,13,38,0.24)] backdrop-blur-md sm:text-xs">
          {backendStatus === "synced" ? "Synced" : backendStatus === "saving" ? "Saving" : backendStatus}
        </div>
        <button
          type="button"
          onClick={phase === "paused" ? resumeGame : pauseGame}
          className="grid size-10 place-items-center rounded-full border border-white/40 bg-[#731d3a]/62 text-white shadow-[0_8px_18px_rgba(70,13,38,0.24)] backdrop-blur-md"
          aria-label={phase === "paused" ? "Resume game" : "Pause game"}
        >
          {phase === "paused" ? <Play className="size-5 fill-white" /> : <Pause className="size-5 fill-white" />}
        </button>
      </div>

      <div className="relative rounded-[1.6rem] border border-white/35 bg-[#65172f]/84 px-3 py-3 shadow-[0_12px_30px_rgba(84,15,44,0.28),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md">
        <div className="absolute inset-x-4 top-0 h-px bg-white/60" />
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div>
            <p className="font-display text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#ffc6be]">
              Score
            </p>
            <p className="font-display text-2xl font-extrabold text-[#ffe9a8] sm:text-3xl">{totalScore}</p>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate font-display text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-white/86">
                R{round} {config.title}
              </p>
              <p className="font-display text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#ffe9a8]">
                {roundScore}/{config.targetPoints}
              </p>
            </div>
            <StarMeter value={roundScore} target={config.targetPoints} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-1">
              <p className="font-display text-[0.54rem] font-extrabold uppercase tracking-[0.12em] text-[#ffc6be]">
                Time
              </p>
              <p className="font-display text-xl font-extrabold text-white">{timeLeft}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-1">
              <p className="font-display text-[0.54rem] font-extrabold uppercase tracking-[0.12em] text-[#ffc6be]">
                Moves
              </p>
              <p className="font-display text-xl font-extrabold text-white">{movesLeft}</p>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {combo > 1 ? (
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/45 bg-[#ff4e9a] px-4 py-1 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_8px_18px_rgba(100,17,52,0.28)]"
              initial={{ opacity: 0, y: -8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.8 }}
            >
              Combo x{combo}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function RoundCompleteOverlay() {
  const round = useEmojiRushStore((state) => state.round);
  const roundScore = useEmojiRushStore((state) => state.roundScore);
  const bestCombo = useEmojiRushStore((state) => state.bestCombo);
  const continueNextRound = useEmojiRushStore((state) => state.continueNextRound);

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-[#5d1637]/48 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,#ff8aac,#ff4f72_48%,#b72c55)] p-6 text-center shadow-[0_24px_70px_rgba(84,15,44,0.38),inset_0_2px_0_rgba(255,255,255,0.32)]"
        initial={{ scale: 0.84, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-white/55 bg-[#ffe97c] text-4xl shadow-[0_10px_0_rgba(129,32,54,0.42)]">
          🎉
        </div>
        <p className="mt-5 font-display text-xs font-extrabold uppercase tracking-[0.24em] text-[#ffe9a8]">
          Round {round} Clear
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold uppercase text-white drop-shadow-[0_5px_0_rgba(100,17,52,0.38)]">
          Sweet Burst
        </h2>
        <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/34 bg-white/18 p-3">
            <p className="font-display text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-white/78">
              Points
            </p>
            <p className="font-display text-3xl font-extrabold text-white">{roundScore}</p>
          </div>
          <div className="rounded-2xl border border-white/34 bg-white/18 p-3">
            <p className="font-display text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-white/78">
              Best Combo
            </p>
            <p className="font-display text-3xl font-extrabold text-white">x{bestCombo}</p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={continueNextRound}
          className={`${candyButton} mt-6 w-full`}
          whileTap={{ y: 6, scale: 0.98 }}
        >
          <Sparkles className="size-5" />
          {round >= 5 ? "Claim Medal" : "Next Round"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function PauseOverlay() {
  const resumeGame = useEmojiRushStore((state) => state.resumeGame);

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-[#5d1637]/52 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.button
        type="button"
        onClick={resumeGame}
        className={`${candyButton} h-16 px-8 text-base`}
        initial={{ scale: 0.88 }}
        animate={{ scale: 1 }}
        whileTap={{ y: 6, scale: 0.98 }}
      >
        <Play className="size-6 fill-[#6e1739]" />
        Resume
      </motion.button>
    </motion.div>
  );
}

function medalLabel(medal: EmojiRushMedal) {
  if (medal === "gold") {
    return "Gold Medal";
  }
  if (medal === "silver") {
    return "Silver Medal";
  }
  if (medal === "bronze") {
    return "Bronze Medal";
  }
  return "Run Complete";
}

function MedalScreen({ leaderboard }: { leaderboard: ReturnType<typeof useEmojiRushBackend>["leaderboard"] }) {
  const medal = useEmojiRushStore((state) => state.medal);
  const totalScore = useEmojiRushStore((state) => state.totalScore);
  const completedRounds = useEmojiRushStore((state) => state.completedRounds);
  const bestCombo = useEmojiRushStore((state) => state.bestCombo);
  const restartGame = useEmojiRushStore((state) => state.restartGame);
  const crownRef = useRef<HTMLDivElement | null>(null);
  const medalTone = medal === "gold" ? "#ffe25b" : medal === "silver" ? "#e8edf4" : medal === "bronze" ? "#ffad69" : "#ff82b2";

  useEffect(() => {
    if (!crownRef.current) {
      return;
    }

    const timeline = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
    timeline.fromTo(crownRef.current, { scale: 0.36, rotate: -14, y: 18 }, { scale: 1, rotate: 0, y: 0, duration: 0.72 });
    timeline.to(crownRef.current, { y: -8, repeat: -1, yoyo: true, duration: 1.15, ease: "sine.inOut" });
    return () => {
      timeline.kill();
    };
  }, []);

  const confetti = useMemo(() => Array.from({ length: medal === "none" ? 18 : 36 }), [medal]);

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
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/40 bg-[#731d3a]/55 px-4 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_18px_rgba(70,13,38,0.25)] backdrop-blur-md"
        >
          <ArrowLeft className="size-4" />
          Games
        </Link>
        <button
          type="button"
          onClick={restartGame}
          className="grid size-10 place-items-center rounded-full border border-white/40 bg-[#731d3a]/55 text-white shadow-[0_8px_18px_rgba(70,13,38,0.25)] backdrop-blur-md"
          aria-label="Restart Emoji Rush"
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
              left: `${(index * 29) % 100}%`,
              top: "-8%",
              backgroundColor: index % 3 === 0 ? "#ffe25b" : index % 3 === 1 ? "#6de8ff" : "#ff79b8"
            }}
            animate={{ y: ["0svh", "112svh"], rotate: [0, 240, 540], opacity: [0, 1, 0] }}
            transition={{ duration: 3.8 + (index % 7) * 0.28, delay: (index % 9) * 0.18, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="grid min-h-0 place-items-center py-4">
        <div className="grid w-full max-w-5xl gap-4 md:grid-cols-[1fr_0.75fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/42 bg-[#731d3a]/74 p-6 text-center shadow-[0_24px_70px_rgba(84,15,44,0.36)] backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#ffec8b,#ff71bd,#7de8ff,#ffec8b)]" />
            <div
              ref={crownRef}
              className="mx-auto grid size-28 place-items-center rounded-full border border-white/65 text-6xl shadow-[0_0_42px_rgba(255,226,91,0.44),0_12px_0_rgba(129,32,54,0.42)]"
              style={{ backgroundColor: medalTone }}
            >
              {medal === "gold" ? <Crown className="size-16 fill-[#b25a00] text-[#b25a00]" /> : <Trophy className="size-16 fill-[#7a2441] text-[#7a2441]" />}
            </div>
            <p className="mt-6 font-display text-xs font-extrabold uppercase tracking-[0.26em] text-[#ffe9a8]">
              {completedRounds}/5 Rounds
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold uppercase text-white drop-shadow-[0_7px_0_rgba(100,17,52,0.45)] sm:text-6xl">
              {medalLabel(medal)}
            </h1>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/34 bg-white/18 p-3">
                <p className="font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white/78">
                  Score
                </p>
                <p className="font-display text-3xl font-extrabold text-white">{totalScore}</p>
              </div>
              <div className="rounded-2xl border border-white/34 bg-white/18 p-3">
                <p className="font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white/78">
                  Rounds
                </p>
                <p className="font-display text-3xl font-extrabold text-white">{completedRounds}</p>
              </div>
              <div className="rounded-2xl border border-white/34 bg-white/18 p-3">
                <p className="font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white/78">
                  Combo
                </p>
                <p className="font-display text-3xl font-extrabold text-white">x{bestCombo}</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={restartGame}
              className={`${candyButton} mt-6`}
              whileTap={{ y: 6, scale: 0.98 }}
            >
              <RotateCcw className="size-5" />
              Play Again
            </motion.button>
          </div>

          <div className="rounded-[2rem] border border-white/36 bg-[#731d3a]/64 p-4 shadow-[0_20px_58px_rgba(84,15,44,0.3)] backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-[#ffe9a8]">
                Leaderboard
              </h2>
              <Trophy className="size-5 text-[#ffe9a8]" />
            </div>
            <div className="grid gap-2">
              {leaderboard.length ? (
                leaderboard.slice(0, 7).map((entry, index) => (
                  <div
                    key={entry.session_id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/20 bg-white/14 px-3 py-2"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-[#ffe97c] font-display text-xs font-extrabold text-[#7b1e3d]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-xs font-extrabold uppercase tracking-[0.1em] text-white">
                        {entry.player_name}
                      </p>
                      <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/62">
                        {entry.medal} · {entry.completed_rounds} rounds
                      </p>
                    </div>
                    <p className="font-display text-lg font-extrabold text-[#ffe9a8]">{entry.total_score}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/20 bg-white/14 px-4 py-6 text-center font-display text-xs font-extrabold uppercase tracking-[0.14em] text-white/70">
                  No scores yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function GamePlayScreen() {
  const phase = useEmojiRushStore((state) => state.phase);
  const backendMessage = useEmojiRushStore((state) => state.backendMessage);
  const tick = useEmojiRushStore((state) => state.tick);
  const clearEffects = useEmojiRushStore((state) => state.clearEffects);

  useEffect(() => {
    const timer = window.setInterval(() => {
      tick();
    }, 1000);
    const fxTimer = window.setInterval(() => {
      clearEffects();
    }, 320);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(fxTimer);
    };
  }, [clearEffects, tick]);

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden">
      <GameHud />
      <div className="grid min-h-0 place-items-center px-2 py-2">
        <PixiBoard />
      </div>
      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/34 bg-[#731d3a]/68 px-3 py-2 shadow-[0_8px_18px_rgba(70,13,38,0.2)] backdrop-blur-md">
          {["🍓", "🍬", "💎", "🌟"].map((item) => (
            <span key={item} className="grid size-9 place-items-center rounded-full bg-white/18 text-xl shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_5px_10px_rgba(70,13,38,0.16)]">
              {item}
            </span>
          ))}
        </div>
        <p className="truncate rounded-full border border-white/34 bg-[#731d3a]/62 px-3 py-2 font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white/74 shadow-[0_8px_18px_rgba(70,13,38,0.2)] backdrop-blur-md sm:text-xs">
          {backendMessage || "Emoji Rush"}
        </p>
      </footer>

      <AnimatePresence>{phase === "round-complete" ? <RoundCompleteOverlay /> : null}</AnimatePresence>
      <AnimatePresence>{phase === "paused" ? <PauseOverlay /> : null}</AnimatePresence>
    </div>
  );
}

export function EmojiRushGame() {
  const phase = useEmojiRushStore((state) => state.phase);
  const { leaderboard, startSecureGame } = useEmojiRushBackend();
  useEmojiRushAudio();

  return (
    <CandyShell>
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <IntroScreen key="intro" onStart={startSecureGame} />
        ) : phase === "game-over" ? (
          <MedalScreen key="game-over" leaderboard={leaderboard} />
        ) : (
          <GamePlayScreen key="play" />
        )}
      </AnimatePresence>
    </CandyShell>
  );
}
