"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { EditableNameField } from "@/components/EditableNameField";
import type { ParticipantState } from "@/types/multiplayer";

type ParticipantCardProps = {
  participant: ParticipantState;
  isCurrentUser?: boolean;
  editable?: boolean;
  onSaveName?: (name: string) => Promise<boolean> | boolean;
  index?: number;
};

export function ParticipantCard({
  participant,
  isCurrentUser = false,
  editable = false,
  onSaveName = async () => false,
  index = 0
}: ParticipantCardProps) {
  return (
    <motion.li
      className="group relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border border-white/11 bg-white/[0.055] p-3 shadow-[0_14px_42px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-colors duration-300 hover:border-cyan-100/28 hover:bg-cyan-200/[0.075] sm:p-4"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.045, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="absolute right-0 top-0 -z-10 size-24 translate-x-1/3 -translate-y-1/3 rounded-full bg-cyan-300/0 blur-2xl transition-colors duration-300 group-hover:bg-cyan-300/14" />
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-100/18 bg-cyan-200/10 text-cyan-50">
        <UserRound className="size-5" />
        <span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-slate-950 bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <EditableNameField name={participant.name} editable={editable} onSave={onSaveName} />
          {isCurrentUser ? (
            <span className="shrink-0 rounded-full border border-emerald-100/18 bg-emerald-200/10 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-50">
              You
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-sans text-xs font-semibold text-white/42">Online in arena</p>
      </div>
    </motion.li>
  );
}
