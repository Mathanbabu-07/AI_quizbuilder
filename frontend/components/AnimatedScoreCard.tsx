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
      className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 text-center shadow-[0_18px_58px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <div className={`mx-auto grid size-11 place-items-center rounded-2xl border border-white/12 bg-white/[0.06] ${tone}`}>
        {icon}
      </div>
      <div className="mt-4 font-display text-3xl font-extrabold text-white">{value}</div>
      <div className="mt-1 font-sans text-xs font-bold uppercase text-white/42">{label}</div>
    </motion.div>
  );
}
