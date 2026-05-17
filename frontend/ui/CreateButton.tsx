"use client";

import { motion } from "framer-motion";
import { PencilLine, Sparkles } from "lucide-react";

type CreateButtonProps = {
  mode?: "ai" | "manual";
  onClick?: () => void;
};

export function CreateButton({ mode = "ai", onClick }: CreateButtonProps) {
  const isManual = mode === "manual";
  const Icon = isManual ? PencilLine : Sparkles;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`group relative isolate inline-flex h-14 min-w-40 items-center justify-center overflow-hidden rounded-xl border px-6 font-display text-sm font-bold uppercase text-white outline-none backdrop-blur-xl transition-colors duration-300 hover:border-white/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-16 sm:min-w-48 sm:px-8 ${
        isManual
          ? "border-fuchsia-200/32 bg-fuchsia-200/10 shadow-[0_0_34px_rgba(217,70,239,0.22)] focus-visible:ring-fuchsia-200"
          : "border-cyan-200/35 bg-cyan-200/10 shadow-[0_0_34px_rgba(34,211,238,0.28)] focus-visible:ring-cyan-200"
      }`}
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      aria-label={isManual ? "Manual create" : "Create with AI"}
    >
      <span
        className={`absolute inset-0 -z-10 bg-[length:240%_100%] opacity-90 motion-safe:animate-[shine_5.5s_linear_infinite] ${
          isManual
            ? "bg-[linear-gradient(110deg,rgba(217,70,239,0.88),rgba(99,102,241,0.74),rgba(34,211,238,0.78),rgba(217,70,239,0.88))]"
            : "bg-[linear-gradient(110deg,rgba(45,212,191,0.95),rgba(99,102,241,0.78),rgba(244,114,182,0.82),rgba(45,212,191,0.95))]"
        }`}
      />
      <span className="absolute inset-[1px] -z-10 rounded-[11px] bg-slate-950/44 backdrop-blur-md transition-colors duration-300 group-hover:bg-slate-950/26" />
      <span className="absolute -inset-x-8 bottom-0 h-px bg-cyan-100/90 blur-[1px]" />
      <span className="absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/25 blur-2xl transition-transform duration-500 group-hover:scale-150" />

      <Icon className="mr-3 size-4 text-cyan-100 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.4} />
      <span>{isManual ? "Manual Create" : "Create With AI"}</span>
    </motion.button>
  );
}
