"use client";

import { motion } from "framer-motion";
import { Loader2, Trophy, UsersRound } from "lucide-react";
import type { RoomState } from "@/types/multiplayer";

type MultiplayerResultsWaitingProps = {
  room: RoomState;
};

export function MultiplayerResultsWaiting({ room }: MultiplayerResultsWaitingProps) {
  const finished = room.leaderboard.length;
  const total = Math.max(1, room.participant_count + 1);

  return (
    <motion.section
      className="relative z-10 grid min-h-dvh place-items-center px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/34 p-6 text-center shadow-[0_28px_100px_rgba(0,0,0,0.36)] backdrop-blur-2xl sm:p-9">
        <span className="absolute left-1/2 top-0 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/14 blur-3xl" />
        <motion.div
          className="mx-auto grid size-24 place-items-center rounded-full border border-cyan-100/20 bg-white/[0.06] text-cyan-100 shadow-[0_0_54px_rgba(34,211,238,0.24)]"
          animate={{ scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="size-10" />
        </motion.div>

        <p className="mt-7 font-display text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100/76">
          Results syncing
        </p>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
          Waiting for other players to finish...
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-sm font-semibold leading-relaxed text-white/58 sm:text-base">
          Your score is locked. The leaderboard will open automatically when every player completes the arena.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-3 flex items-center justify-between gap-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white/68">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="size-4 text-cyan-100/70" />
              Completion
            </span>
            <span>
              {finished}/{total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (finished / total) * 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <motion.div
          className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-cyan-100/12 bg-cyan-100/[0.055] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-50/78"
          animate={{ opacity: [0.56, 1, 0.56] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Loader2 className="size-4 animate-spin" />
          Live arena sync active
        </motion.div>
      </div>
    </motion.section>
  );
}
