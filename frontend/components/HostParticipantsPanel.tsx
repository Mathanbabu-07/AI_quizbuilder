"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Signal, UsersRound } from "lucide-react";
import { useState } from "react";
import { ParticipantCard } from "@/components/ParticipantCard";
import type { RoomState } from "@/types/multiplayer";

type HostParticipantsPanelProps = {
  room: RoomState | null;
  status: "idle" | "connecting" | "active" | "error";
  errorMessage?: string | null;
  className?: string;
};

export function HostParticipantsPanel({ room, status, errorMessage, className = "" }: HostParticipantsPanelProps) {
  const [open, setOpen] = useState(true);
  const participants = room?.participants ?? [];

  return (
    <motion.aside
      className={`relative isolate overflow-hidden rounded-3xl border border-white/12 bg-white/[0.055] shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${className}`}
      initial={{ opacity: 0, x: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 14, filter: "blur(8px)" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="absolute right-0 top-0 -z-10 size-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-300/12 blur-3xl" />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100/18 bg-emerald-200/10 text-emerald-50">
            <UsersRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-white">Participants</p>
            <p className="mt-1 truncate text-xs font-semibold text-white/42">
              {status === "connecting"
                ? "Opening realtime channel"
                : status === "error"
                  ? errorMessage ?? "Realtime unavailable"
                  : `${participants.length} connected`}
            </p>
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-white/54">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="border-t border-white/10 p-4 pt-3 sm:p-5 sm:pt-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {participants.length ? (
              <ul className="grid gap-2.5">
                {participants.map((participant, index) => (
                  <ParticipantCard key={participant.id} participant={participant} index={index} />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/24 px-4 py-5 text-center">
                <Signal className="mx-auto mb-3 size-5 text-cyan-100/58" />
                <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white/62">
                  Waiting for players
                </p>
                <p className="mt-2 text-xs font-semibold text-white/36">Share the room code to fill the arena.</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.aside>
  );
}
