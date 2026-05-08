"use client";

import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";

export function JoinButton() {
  return (
    <motion.button
      type="button"
      className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.075] px-4 font-display text-xs font-bold uppercase text-white/90 shadow-[0_10px_32px_rgba(0,0,0,0.24)] outline-none backdrop-blur-2xl transition-colors duration-300 hover:border-emerald-200/45 hover:bg-emerald-200/12 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-12 sm:px-5"
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 430, damping: 30 }}
      aria-label="Join a quiz"
    >
      <UsersRound className="size-4 text-emerald-200/90 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.2} />
      <span>Join</span>
    </motion.button>
  );
}
