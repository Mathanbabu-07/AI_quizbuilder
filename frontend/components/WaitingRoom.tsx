"use client";

import { motion } from "framer-motion";
import { ArrowLeft, UsersRound } from "lucide-react";
import { ParticipantCard } from "@/components/ParticipantCard";
import { RoomCodePanel } from "@/components/RoomCodePanel";
import { WaitingStatus } from "@/components/WaitingStatus";
import type { RoomState } from "@/types/multiplayer";

type WaitingRoomProps = {
  room: RoomState;
  participantId: string;
  onUpdateName: (name: string) => Promise<boolean> | boolean;
  onLeave: () => void;
};

export function WaitingRoom({ room, participantId, onUpdateName, onLeave }: WaitingRoomProps) {
  const started = room.status === "started";

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh justify-center px-4 py-20 sm:px-8 sm:py-24"
      initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.4fr)_minmax(160px,0.5fr)] lg:items-start">
          <RoomCodePanel code={room.code} compact />
          <div className="text-center">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-100/76">
              Multiplayer lobby
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">Waiting Room</h1>
            <p className="mt-3 font-sans text-sm font-semibold text-white/48">
              {room.participant_count} connected {room.participant_count === 1 ? "player" : "players"}
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={onLeave}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 font-display text-xs font-extrabold uppercase tracking-[0.14em] text-white/70 backdrop-blur-xl transition-colors hover:border-white/24 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Leave
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/12 bg-slate-950/30 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl border border-cyan-100/18 bg-cyan-200/10 text-cyan-50">
                <UsersRound className="size-4" />
              </span>
              <div>
                <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-white">
                  Participants
                </p>
                <p className="mt-1 text-xs font-semibold text-white/42">Names sync live across the arena</p>
              </div>
            </div>
          </div>

          <ul className="grid gap-3">
            {room.participants.map((participant, index) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                isCurrentUser={participant.id === participantId}
                editable={participant.id === participantId}
                onSaveName={onUpdateName}
                index={index}
              />
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <WaitingStatus started={started} />
        </div>
      </div>
    </motion.section>
  );
}
