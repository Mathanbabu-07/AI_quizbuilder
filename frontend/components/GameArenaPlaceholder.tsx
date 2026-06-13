"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, CircleDot, Gamepad2, Grid3x3, RadioTower, Sparkles } from "lucide-react";
import type { GameMode } from "@/lib/gameModes";

type GameArenaPlaceholderProps = {
  game: GameMode;
};

const toneClasses: Record<GameMode["tone"], { border: string; glow: string; icon: string; text: string }> = {
  cricket: {
    border: "border-emerald-100/24",
    glow: "bg-emerald-300/16",
    icon: "text-emerald-100",
    text: "text-emerald-100/78"
  },
  emoji: {
    border: "border-fuchsia-100/24",
    glow: "bg-fuchsia-300/16",
    icon: "text-fuchsia-100",
    text: "text-fuchsia-100/78"
  },
  memory: {
    border: "border-cyan-100/24",
    glow: "bg-cyan-300/16",
    icon: "text-cyan-100",
    text: "text-cyan-100/78"
  }
};

export function GameArenaPlaceholder({ game }: GameArenaPlaceholderProps) {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;
  const tone = toneClasses[game.tone];

  return (
    <motion.section
      className="relative z-10 flex min-h-svh items-center justify-center overflow-hidden px-4 py-24 text-white sm:px-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className={`absolute left-[12%] top-[18%] size-40 rounded-full ${tone.glow} blur-3xl`}
          animate={motionEnabled ? { scale: [1, 1.12, 1], opacity: [0.28, 0.5, 0.28] } : false}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[16%] right-[12%] size-52 rounded-full bg-cyan-300/10 blur-3xl"
          animate={motionEnabled ? { scale: [1.08, 1, 1.08], opacity: [0.22, 0.42, 0.22] } : false}
          transition={{ duration: 8.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/?view=moreGames"
          className="group inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.055] px-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-white/72 outline-none backdrop-blur-xl transition-colors duration-300 hover:border-cyan-100/34 hover:bg-cyan-100/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          More Games
        </Link>

        <div className={`mt-8 overflow-hidden rounded-[2rem] border ${tone.border} bg-white/[0.055] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-8`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
            <div>
              <p className={`font-display text-xs font-extrabold uppercase tracking-[0.28em] ${tone.text}`}>
                {game.eyebrow}
              </p>
              <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide text-white sm:text-6xl">
                {game.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-relaxed text-white/52 sm:text-base">
                {game.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/58">
                  <RadioTower className="size-4 text-cyan-100/72" />
                  Arena Link
                </span>
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/58">
                  <Sparkles className="size-4 text-fuchsia-100/72" />
                  Prototype
                </span>
              </div>
            </div>

            <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-white/12 bg-slate-950/26">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:38px_38px]" />
              <motion.div
                className="absolute left-1/2 top-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] border border-cyan-100/18 bg-cyan-100/8 text-cyan-50 shadow-[0_0_42px_rgba(34,211,238,0.16)]"
                animate={motionEnabled ? { y: [0, -10, 0], rotate: [-2, 2, -2] } : false}
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Gamepad2 className="size-14" strokeWidth={1.45} />
              </motion.div>
              <motion.div
                className="absolute left-8 top-8 grid size-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.055] text-white/52"
                animate={motionEnabled ? { y: [0, -8, 0] } : false}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <BrainCircuit className="size-5" />
              </motion.div>
              <motion.div
                className="absolute bottom-8 right-8 grid size-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.055] text-white/52"
                animate={motionEnabled ? { y: [0, 8, 0] } : false}
                transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Grid3x3 className="size-5" />
              </motion.div>
              <CircleDot className={`absolute right-8 top-8 size-8 ${tone.icon}`} strokeWidth={1.6} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

