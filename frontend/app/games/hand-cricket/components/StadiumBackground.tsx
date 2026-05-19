"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const particles = [
  { x: "12%", y: "22%", delay: 0.1 },
  { x: "26%", y: "66%", delay: 0.6 },
  { x: "42%", y: "18%", delay: 1.2 },
  { x: "64%", y: "74%", delay: 0.4 },
  { x: "78%", y: "26%", delay: 1.6 },
  { x: "88%", y: "58%", delay: 0.9 }
];

export const StadiumBackground = memo(function StadiumBackground() {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/games/hand-cricket/stadium.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,26,0.48)_0%,rgba(9,15,38,0.28)_42%,rgba(2,7,18,0.74)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.22),transparent_38%),radial-gradient(circle_at_78%_58%,rgba(168,85,247,0.16),transparent_34%),radial-gradient(circle_at_18%_62%,rgba(16,185,129,0.14),transparent_32%)]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-slate-950/70 to-transparent" />
      <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:100%_4px]" />
      <div className="absolute inset-x-[8%] top-[21%] h-px bg-gradient-to-r from-transparent via-cyan-100/34 to-transparent" />
      <div className="absolute inset-x-[14%] bottom-[19%] h-px bg-gradient-to-r from-transparent via-emerald-100/28 to-transparent" />
      {particles.map((particle) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          className="absolute size-1.5 rounded-full bg-cyan-100/62 shadow-[0_0_14px_rgba(103,232,249,0.45)] will-change-transform"
          style={{ left: particle.x, top: particle.y }}
          animate={motionEnabled ? { y: [0, -12, 0], opacity: [0.28, 0.86, 0.28] } : false}
          transition={{ duration: 5.8, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
});
