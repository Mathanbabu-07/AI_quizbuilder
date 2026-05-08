"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export function SettingsButton() {
  return (
    <motion.button
      type="button"
      className="group grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white/85 shadow-[0_10px_32px_rgba(0,0,0,0.24)] outline-none backdrop-blur-2xl transition-colors duration-300 hover:border-fuchsia-200/40 hover:bg-fuchsia-200/12 hover:text-white focus-visible:ring-2 focus-visible:ring-fuchsia-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:size-12"
      whileHover={{ rotate: 45, scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      aria-label="Open settings"
    >
      <Settings className="size-5 transition-[filter] duration-300 group-hover:drop-shadow-[0_0_10px_rgba(245,208,254,0.8)]" strokeWidth={2.15} />
    </motion.button>
  );
}
