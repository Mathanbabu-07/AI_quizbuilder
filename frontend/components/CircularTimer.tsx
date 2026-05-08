"use client";

import { motion } from "framer-motion";

type CircularTimerProps = {
  value: number;
  max: number;
  label: string;
};

export function CircularTimer({ value, max, label }: CircularTimerProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value / max));
  const urgent = progress <= 0.25;

  return (
    <div className="relative grid size-28 place-items-center rounded-full border border-white/10 bg-white/[0.055] shadow-[0_0_26px_rgba(34,211,238,0.12)] backdrop-blur-xl">
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={urgent ? "rgb(251,113,133)" : "rgb(103,232,249)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-display text-2xl font-extrabold ${urgent ? "text-rose-100" : "text-white"}`}>
          {Math.max(0, value)}
        </div>
        <div className="mt-1 font-sans text-[0.62rem] font-bold uppercase text-white/42">{label}</div>
      </div>
    </div>
  );
}
