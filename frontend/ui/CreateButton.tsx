"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type CreateButtonProps = {
  onClick?: () => void;
};

export function CreateButton({ onClick }: CreateButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group relative isolate inline-flex h-14 min-w-40 items-center justify-center overflow-hidden rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-8 font-display text-sm font-bold uppercase text-white shadow-[0_0_34px_rgba(34,211,238,0.28)] outline-none backdrop-blur-xl transition-colors duration-300 hover:border-white/60 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-16 sm:min-w-48"
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      aria-label="Create a quiz"
    >
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(45,212,191,0.95),rgba(99,102,241,0.78),rgba(244,114,182,0.82),rgba(45,212,191,0.95))] bg-[length:240%_100%] opacity-90 motion-safe:animate-[shine_5.5s_linear_infinite]" />
      <span className="absolute inset-[1px] -z-10 rounded-[11px] bg-slate-950/44 backdrop-blur-md transition-colors duration-300 group-hover:bg-slate-950/26" />
      <span className="absolute -inset-x-8 bottom-0 h-px bg-cyan-100/90 blur-[1px]" />
      <span className="absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/25 blur-2xl transition-transform duration-500 group-hover:scale-150" />

      <Sparkles className="mr-3 size-4 text-cyan-100 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.4} />
      <span>Create</span>
    </motion.button>
  );
}
