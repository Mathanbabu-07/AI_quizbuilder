"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedScoreCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: string;
};

export function AnimatedScoreCard({ label, value, icon, tone = "text-cyan-100" }: AnimatedScoreCardProps) {
  return (
    <motion.div
      className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-3 text-center shadow-[0_18px_58px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-3xl sm:p-5"
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <div className={`mx-auto grid size-9 place-items-center rounded-xl border border-white/12 bg-white/[0.06] sm:size-11 sm:rounded-2xl ${tone}`}>
        {icon}
      </div>
      <div className="mt-3 break-words font-display text-xl font-extrabold leading-tight text-white sm:mt-4 sm:text-3xl">{value}</div>
      <div className="mt-1 font-sans text-[0.62rem] font-bold uppercase leading-tight text-white/42 sm:text-xs">{label}</div>
    </motion.div>
  );
}
