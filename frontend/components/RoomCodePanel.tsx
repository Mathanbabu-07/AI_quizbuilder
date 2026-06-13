"use client";

import { motion } from "framer-motion";
import { RadioTower } from "lucide-react";
import { CopyCodeButton } from "@/components/CopyCodeButton";

type RoomCodePanelProps = {
  code: string;
  compact?: boolean;
};

export function RoomCodePanel({ code, compact = false }: RoomCodePanelProps) {
  return (
    <motion.div
      className="relative isolate overflow-hidden rounded-3xl border border-cyan-100/18 bg-slate-950/38 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.34),0_0_44px_rgba(34,211,238,0.13)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
      <span className="absolute -left-12 top-1/2 -z-10 size-40 -translate-y-1/2 rounded-full bg-cyan-300/16 blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-cyan-100/18 bg-cyan-200/10 text-cyan-50">
            <RadioTower className="size-4" />
          </span>
          <div>
            <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-cyan-100/70">
              Room Code
            </p>
            <p
              className={`mt-1 font-display font-extrabold tracking-[0.18em] text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.35)] ${
                compact ? "text-3xl" : "text-4xl sm:text-5xl"
              }`}
            >
              {code}
            </p>
          </div>
        </div>
        <CopyCodeButton code={code} />
      </div>
    </motion.div>
  );
}

