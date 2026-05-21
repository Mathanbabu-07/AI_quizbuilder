"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  Candy,
  CircleDot,
  Gamepad2,
  Grid3x3,
  Hand,
  SmilePlus,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon
} from "lucide-react";
import { gameModes, type GameMode } from "@/lib/gameModes";

type MoreGamesHubProps = {
  onBack: () => void;
};

type ToneStyle = {
  shell: string;
  glow: string;
  icon: string;
  line: string;
  chip: string;
  accentIcon: LucideIcon;
};

const toneStyles: Record<GameMode["tone"], ToneStyle> = {
  cricket: {
    shell: "border-emerald-200/24 bg-emerald-200/[0.055] hover:border-emerald-100/52",
    glow: "from-emerald-300/28 via-cyan-300/16 to-transparent",
    icon: "border-emerald-100/24 bg-emerald-100/10 text-emerald-50 shadow-[0_0_28px_rgba(16,185,129,0.22)]",
    line: "bg-emerald-100/70",
    chip: "border-emerald-100/18 bg-emerald-100/8 text-emerald-50/72",
    accentIcon: Trophy
  },
  emoji: {
    shell: "border-fuchsia-200/24 bg-fuchsia-200/[0.055] hover:border-fuchsia-100/52",
    glow: "from-fuchsia-300/26 via-amber-200/18 to-transparent",
    icon: "border-fuchsia-100/24 bg-fuchsia-100/10 text-fuchsia-50 shadow-[0_0_28px_rgba(217,70,239,0.2)]",
    line: "bg-fuchsia-100/70",
    chip: "border-fuchsia-100/18 bg-fuchsia-100/8 text-fuchsia-50/72",
    accentIcon: Sparkles
  },
  memory: {
    shell: "border-cyan-200/24 bg-cyan-200/[0.052] hover:border-cyan-100/52",
    glow: "from-cyan-300/25 via-violet-300/17 to-transparent",
    icon: "border-cyan-100/24 bg-cyan-100/10 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.2)]",
    line: "bg-cyan-100/70",
    chip: "border-cyan-100/18 bg-cyan-100/8 text-cyan-50/72",
    accentIcon: BrainCircuit
  }
};

function HandCricketVisual({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <div className="relative h-32 overflow-hidden rounded-lg border border-emerald-100/12 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.18),transparent_48%)] sm:h-36">
      <div className="absolute inset-x-8 bottom-5 h-12 rounded-[50%] border-t border-emerald-100/22" />
      <div className="absolute inset-x-12 bottom-8 h-9 rounded-[50%] border-t border-cyan-100/18" />
      <motion.span
        className="absolute left-[31%] top-[28%] h-20 w-3 origin-bottom rounded-full bg-gradient-to-b from-cyan-100 via-emerald-200 to-emerald-500 shadow-[0_0_18px_rgba(52,211,153,0.42)]"
        animate={motionEnabled ? { rotate: [-18, 14, -18] } : false}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute right-[29%] top-[34%] size-9 rounded-full border border-cyan-100/35 bg-cyan-100/16 shadow-[0_0_22px_rgba(103,232,249,0.36)]"
        animate={motionEnabled ? { scale: [1, 1.14, 1], x: [0, -8, 0], opacity: [0.74, 1, 0.74] } : false}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2].map((item) => (
        <motion.span
          key={item}
          className="absolute top-[35%] size-1.5 rounded-full bg-emerald-100/78"
          style={{ left: `${54 + item * 6}%` }}
          animate={motionEnabled ? { x: [0, 14, 0], opacity: [0.22, 0.9, 0.22] } : false}
          transition={{ duration: 2.4, delay: item * 0.18, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <Hand className="absolute left-5 top-5 size-8 text-emerald-50/42" strokeWidth={1.5} />
    </div>
  );
}

function EmojiCrushVisual({ motionEnabled }: { motionEnabled: boolean }) {
  const icons = [
    { Icon: SmilePlus, className: "left-[18%] top-[23%] text-amber-100", delay: 0 },
    { Icon: Candy, className: "left-[43%] top-[45%] text-fuchsia-100", delay: 0.22 },
    { Icon: Zap, className: "right-[18%] top-[25%] text-cyan-100", delay: 0.44 }
  ];

  return (
    <div className="relative h-32 overflow-hidden rounded-lg border border-fuchsia-100/12 bg-[radial-gradient(circle_at_50%_20%,rgba(217,70,239,0.17),transparent_48%)] sm:h-36">
      {icons.map(({ Icon, className, delay }) => (
        <motion.span
          key={className}
          className={`absolute grid size-14 place-items-center rounded-2xl border border-white/14 bg-white/[0.07] shadow-[0_0_22px_rgba(244,114,182,0.2)] ${className}`}
          animate={motionEnabled ? { y: [0, -8, 0], rotate: [-5, 5, -5], scale: [1, 1.06, 1] } : false}
          transition={{ duration: 3.1, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="size-7" strokeWidth={1.7} />
        </motion.span>
      ))}
      {[0, 1, 2, 3, 4].map((item) => (
        <motion.span
          key={item}
          className="absolute size-1.5 rounded-full bg-white/78"
          style={{ left: `${18 + item * 15}%`, top: `${70 - (item % 2) * 38}%` }}
          animate={motionEnabled ? { scale: [0.8, 1.6, 0.8], opacity: [0.2, 0.82, 0.2] } : false}
          transition={{ duration: 2.6, delay: item * 0.17, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function MemoryGridVisual({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <div className="relative h-32 overflow-hidden rounded-lg border border-cyan-100/12 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.16),transparent_48%)] sm:h-36">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-60" />
      <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <motion.span
            key={index}
            className="size-8 rounded-lg border border-cyan-100/18 bg-cyan-100/10 shadow-[0_0_16px_rgba(34,211,238,0.16)]"
            animate={motionEnabled ? { rotateY: [0, 180, 360], opacity: [0.45, 0.9, 0.45] } : false}
            transition={{ duration: 5.6, delay: index * 0.08, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.span
        className="absolute inset-x-8 top-7 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent"
        animate={motionEnabled ? { y: [0, 78, 0], opacity: [0.16, 0.7, 0.16] } : false}
        transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}
      />
      <Grid3x3 className="absolute right-5 top-5 size-8 text-cyan-50/38" strokeWidth={1.5} />
    </div>
  );
}

function GameVisual({ tone, motionEnabled }: { tone: GameMode["tone"]; motionEnabled: boolean }) {
  if (tone === "cricket") {
    return <HandCricketVisual motionEnabled={motionEnabled} />;
  }

  if (tone === "emoji") {
    return <EmojiCrushVisual motionEnabled={motionEnabled} />;
  }

  return <MemoryGridVisual motionEnabled={motionEnabled} />;
}

function GameCard({ game, index }: { game: GameMode; index: number }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;
  const style = toneStyles[game.tone];
  const AccentIcon = style.accentIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.58, delay: 0.08 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        type="button"
        onClick={() => router.push(game.path)}
        className={`group relative isolate flex aspect-square w-full flex-col overflow-hidden rounded-lg border p-4 text-left shadow-[0_22px_70px_rgba(0,0,0,0.34)] outline-none backdrop-blur-2xl transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:p-5 ${style.shell}`}
        whileHover={motionEnabled ? { y: -8, scale: 1.018 } : undefined}
        whileTap={{ scale: 0.982 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        <span className={`absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b ${style.glow} opacity-90 transition-opacity duration-300 group-hover:opacity-100`} />
        <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.1),transparent_26%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))]" />
        <span className="absolute inset-x-8 top-0 h-px bg-white/70 opacity-50 transition-opacity duration-300 group-hover:opacity-90" />
        <span className={`absolute -right-8 top-20 size-32 rounded-full ${style.line} opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-125`} />

        <GameVisual tone={game.tone} motionEnabled={motionEnabled} />

        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-5">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] ${style.chip}`}>
            <AccentIcon className="size-3.5" strokeWidth={2.1} />
            {game.eyebrow}
          </span>
          <CircleDot className="size-5 text-white/30 transition-colors duration-300 group-hover:text-white/62" strokeWidth={1.8} />
        </div>

        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl lg:text-[2rem]">
          {game.title}
        </h2>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-white/52 sm:text-sm">
          {game.description}
        </p>

        <span className="mt-auto flex items-center justify-between pt-4">
          <span className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-white/62">
            Enter Arena
          </span>
          <span className={`grid size-11 place-items-center rounded-lg border ${style.icon} transition-transform duration-300 group-hover:translate-x-1`}>
            <Gamepad2 className="size-5" strokeWidth={2.1} />
          </span>
        </span>

        <motion.span
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/12 opacity-0"
          whileTap={{ scale: [0.2, 3.6], opacity: [0.28, 0] }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        />
      </motion.button>
    </motion.div>
  );
}

export function MoreGamesHub({ onBack }: MoreGamesHubProps) {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <motion.section
      className="relative isolate z-10 min-h-dvh overflow-hidden px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 34, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45"
          style={{ backgroundImage: "url('/games/more-games-background.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,23,0.82),rgba(8,18,42,0.58)_48%,rgba(2,6,23,0.84)),radial-gradient(circle_at_26%_24%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(217,70,239,0.18),transparent_32%)]" />
        <motion.div
          className="absolute left-[8%] top-[14%] size-28 rounded-full border border-cyan-100/10"
          animate={motionEnabled ? { y: [0, -14, 0], rotate: [0, 18, 0] } : false}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[12%] right-[7%] size-36 rounded-full border border-fuchsia-100/10"
          animate={motionEnabled ? { y: [0, 16, 0], rotate: [0, -20, 0] } : false}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-x-[8%] top-32 h-px bg-gradient-to-r from-transparent via-cyan-100/24 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <motion.button
          type="button"
          onClick={onBack}
          className="group inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.055] px-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-white/72 outline-none backdrop-blur-xl transition-colors duration-300 hover:border-cyan-100/34 hover:bg-cyan-100/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Home
        </motion.button>

        <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-100/76">
              Futuristic Arcade
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold uppercase text-white sm:text-6xl">
              More Games
            </h1>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-relaxed text-white/50 sm:text-base">
            Select a premium GENQUIZ side arena built for quick sessions, cinematic effects, and fast multiplayer expansion.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {gameModes.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
