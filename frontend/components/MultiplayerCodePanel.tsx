"use client";

import { motion } from "framer-motion";
import { Radio, Users } from "lucide-react";
import { CopyCodeButton } from "@/components/CopyCodeButton";

type MultiplayerCodePanelProps = {
  code: string;
};

export function MultiplayerCodePanel({ code }: MultiplayerCodePanelProps) {
  return (
    <motion.aside
      className="relative isolate overflow-hidden rounded-3xl border border-cyan-100/20 bg-slate-950/36 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.34),0_0_42px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-5"
      initial={{ opacity: 0, x: -18, scale: 0.97, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -14, scale: 0.97, filter: "blur(8px)" }}
      transition={{ type: "spring", stiffness: 240, damping: 28, mass: 0.8 }}
    >
      <motion.span
        className="absolute -left-12 top-1/2 -z-10 size-36 -translate-y-1/2 rounded-full bg-cyan-300/18 blur-3xl"
        animate={{ opacity: [0.36, 0.72, 0.36], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-cyan-100/18 bg-cyan-200/10 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.14)]">
            <Users className="size-4" />
          </span>
          <div>
            <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-100/68">
              Multiplayer
            </p>
            <p className="mt-0.5 font-sans text-xs font-semibold text-white/42">Host room code</p>
          </div>
        </div>
        <Radio className="size-4 text-emerald-100/70" />
      </div>

      <div className="mt-5 flex min-w-0 flex-col gap-4">
        <motion.div
          className="min-w-0 break-all font-display text-4xl font-extrabold tracking-[0.16em] text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.35)] sm:text-5xl xl:text-4xl 2xl:text-5xl"
          initial={{ letterSpacing: "0.34em", opacity: 0.3 }}
          animate={{ letterSpacing: "0.16em", opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {code}
        </motion.div>
        <div className="flex justify-start">
          <CopyCodeButton code={code} />
        </div>
      </div>
    </motion.aside>
  );
}
