"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  Candy,
  Cpu,
  Gamepad2,
  Grid3x3,
  Hand,
  Joystick,
  Layers3,
  RadioTower,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  Wand2,
  Zap,
  type LucideIcon
} from "lucide-react";
import type { RefObject } from "react";

type AboutGQSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: string;
};

type GameSignal = {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
};

const coreFeatures: Feature[] = [
  {
    icon: BrainCircuit,
    title: "AI Quiz Engine",
    body: "Generate topic-based quizzes with structured choices, answer validation, difficulty tuning, timers, and quick review.",
    tone: "from-cyan-300/18 via-sky-300/8 to-transparent"
  },
  {
    icon: Wand2,
    title: "Manual Creator",
    body: "Build your own quiz rounds with compact controls, saved drafts, host review, room codes, and clean question setup.",
    tone: "from-fuchsia-300/18 via-violet-300/8 to-transparent"
  },
  {
    icon: UsersRound,
    title: "Live Arena Flow",
    body: "Run quiz sessions with participants, timed questions, scoreboard pacing, results, and multiplayer-ready architecture.",
    tone: "from-emerald-300/18 via-cyan-300/8 to-transparent"
  }
];

const gameSignals: GameSignal[] = [
  {
    icon: Hand,
    title: "Hand Cricket",
    body: "Solo AI stadium mode with six-ball innings, timed number picks, hand reveals, target chase, and match history.",
    accent: "text-emerald-100"
  },
  {
    icon: Candy,
    title: "Emoji Rush",
    body: "A playable match-3 arcade run with animated board movement, rounds, combos, medals, audio cues, and backend scoring.",
    accent: "text-amber-100"
  },
  {
    icon: Grid3x3,
    title: "Memory Grid",
    body: "A neural tile arena placeholder designed for the next memory game implementation.",
    accent: "text-cyan-100"
  }
];

const summaryItems = [
  { label: "Create", value: "AI + Manual", icon: Sparkles },
  { label: "Host", value: "Rooms + Players", icon: RadioTower },
  { label: "Play", value: "Quiz + Arcade", icon: Joystick },
  { label: "Track", value: "Results + Stats", icon: Trophy }
];

function AnimatedGQLogo() {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <motion.div
      className="relative mx-auto grid size-44 place-items-center sm:size-56"
      initial={{ opacity: 0, scale: 0.92, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-3 rounded-full border border-cyan-100/24"
        animate={motionEnabled ? { rotate: 360 } : false}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border border-cyan-100/28 bg-slate-950/80 text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.18)] backdrop-blur-md">
          <Zap className="size-4" />
        </span>
      </motion.div>
      <motion.div
        className="absolute inset-8 rounded-full border border-fuchsia-100/20"
        animate={motionEnabled ? { rotate: -360 } : false}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-lg border border-fuchsia-100/24 bg-slate-950/80 text-fuchsia-100 shadow-[0_0_20px_rgba(240,171,252,0.16)] backdrop-blur-md">
          <Gamepad2 className="size-3.5" />
        </span>
      </motion.div>
      <div className="absolute inset-0 rounded-full bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(240,171,252,0.07)_1px,transparent_1px)] bg-[size:20px_20px] opacity-70 [mask-image:radial-gradient(circle,black_48%,transparent_72%)]" />
      <motion.div
        className="relative grid size-28 place-items-center rounded-[2rem] border border-white/18 bg-white/[0.075] shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_38px_rgba(34,211,238,0.16)] backdrop-blur-2xl sm:size-36"
        animate={motionEnabled ? { y: [0, -7, 0] } : false}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent" />
        <span className="bg-[linear-gradient(110deg,#ffffff,#67e8f9,#f0abfc,#ffffff)] bg-[length:220%_100%] bg-clip-text font-display text-5xl font-extrabold text-transparent motion-safe:animate-[shine_4.8s_linear_infinite] sm:text-6xl">
          GQ
        </span>
        <span className="mt-1 font-display text-[0.62rem] font-extrabold uppercase text-cyan-100/62">
          Arcade OS
        </span>
      </motion.div>
    </motion.div>
  );
}

function SignalCard({ item, index }: { item: Feature; index: number }) {
  const Icon = item.icon;

  return (
    <motion.article
      className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-5 shadow-[0_18px_58px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ delay: index * 0.08, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
    >
      <span className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${item.tone} opacity-80`} />
      <span className="absolute inset-x-6 top-0 h-px bg-white/55 opacity-40 transition-opacity duration-300 group-hover:opacity-80" />
      <div className="relative mb-5 grid size-11 place-items-center rounded-xl border border-cyan-100/16 bg-cyan-100/8 text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,0.12)]">
        <Icon className="size-5" strokeWidth={1.9} />
      </div>
      <h3 className="relative font-display text-xl font-extrabold text-white">{item.title}</h3>
      <p className="relative mt-3 font-sans text-sm font-medium leading-7 text-white/58">{item.body}</p>
    </motion.article>
  );
}

function GameSignalCard({ game, index }: { game: GameSignal; index: number }) {
  const Icon = game.icon;

  return (
    <motion.div
      className="group relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-4 shadow-[0_14px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl"
      initial={{ opacity: 0, x: -18 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 4 }}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-50" />
      <div className="flex gap-4">
        <motion.div
          className={`grid size-12 shrink-0 place-items-center rounded-xl border border-white/14 bg-white/[0.075] ${game.accent}`}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.6 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="size-6" strokeWidth={1.8} />
        </motion.div>
        <div>
          <h4 className="font-display text-base font-extrabold text-white">{game.title}</h4>
          <p className="mt-1 text-sm font-semibold leading-6 text-white/54">{game.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AboutGQSection({ sectionRef }: AboutGQSectionProps) {
  return (
    <section ref={sectionRef} className="relative z-10 px-4 pb-24 pt-10 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <AnimatedGQLogo />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/16 bg-white/[0.055] px-4 py-2 font-display text-[0.68rem] font-extrabold uppercase text-cyan-100/76 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl">
              <Sparkles className="size-3.5" />
              About GQ
            </div>
            <h2 className="max-w-4xl bg-[linear-gradient(95deg,#fff,#67e8f9,#f0abfc,#fff)] bg-[length:260%_100%] bg-clip-text font-display text-3xl font-extrabold leading-tight text-transparent motion-safe:animate-[shine_5s_linear_infinite] sm:text-5xl">
              GENQUIZ is now a quiz arena and futuristic game hub.
            </h2>
            <p className="mt-5 max-w-2xl font-sans text-base font-medium leading-8 text-white/62 sm:text-lg">
              Build quizzes with AI or manual controls, host live room-code sessions, then jump into premium mini-games like Hand Cricket and Emoji Rush from the same neon GENQUIZ universe.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {summaryItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  >
                    <div className="grid size-10 place-items-center rounded-lg border border-cyan-100/16 bg-cyan-100/8 text-cyan-100">
                      <Icon className="size-4.5" />
                    </div>
                    <div>
                      <p className="font-display text-[0.66rem] font-extrabold uppercase text-white/42">{item.label}</p>
                      <p className="font-display text-sm font-extrabold text-white">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {coreFeatures.map((feature, index) => (
            <SignalCard key={feature.title} item={feature} index={index} />
          ))}
        </div>

        <motion.div
          className="mt-5 grid gap-5 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] p-5 shadow-[0_18px_64px_rgba(0,0,0,0.3)] backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] sm:p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-100/55 via-fuchsia-100/45 to-transparent" />
            <div className="mb-4 mt-4 inline-flex items-center gap-2 font-display text-xs font-extrabold uppercase text-fuchsia-100/72">
              <Rocket className="size-4" />
              More Games Expansion
            </div>
            <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              A scalable arcade layer built beside the quiz engine.
            </h3>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/55">
              The new game section keeps quiz creation isolated while adding dedicated game routes, stores, components, animations, and backend hooks for future multiplayer growth.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { icon: Layers3, label: "Isolated routes" },
                { icon: Cpu, label: "Optimized stores" },
                { icon: ShieldCheck, label: "Backend stats" },
                { icon: Gamepad2, label: "Mobile controls" }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <Icon className="mb-2 size-4 text-cyan-100/70" />
                    <p className="font-display text-[0.68rem] font-extrabold uppercase text-white/58">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            {gameSignals.map((game, index) => (
              <GameSignalCard key={game.title} game={game} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

