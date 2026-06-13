"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, Crown, Gamepad2, Rocket, Sparkles, Target, Trophy, Zap } from "lucide-react";

const icons = [
  { Icon: Trophy, x: 6, y: 0, delay: 0, color: "text-amber-100/42" },
  { Icon: Gamepad2, x: 52, y: 28, delay: 0.3, color: "text-cyan-100/40" },
  { Icon: Zap, x: 16, y: 74, delay: 0.6, color: "text-fuchsia-100/36" },
  { Icon: Brain, x: 82, y: 86, delay: 0.9, color: "text-emerald-100/34" },
  { Icon: Target, x: 104, y: 6, delay: 1.2, color: "text-sky-100/36" },
  { Icon: Crown, x: 130, y: 58, delay: 1.5, color: "text-amber-100/32" },
  { Icon: Rocket, x: 40, y: 116, delay: 1.8, color: "text-cyan-100/34" },
  { Icon: Sparkles, x: 112, y: 126, delay: 2.1, color: "text-white/34" }
];

export function FloatingGameIcons() {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <motion.div
      className="pointer-events-auto absolute left-4 top-20 hidden h-44 w-44 sm:left-8 sm:top-8 sm:block lg:left-10 lg:top-10"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-cyan-200/5 blur-3xl" />
      {icons.map(({ Icon, x, y, delay, color }) => (
        <motion.div
          key={`${x}-${y}`}
          className={`group absolute grid size-10 place-items-center rounded-2xl border border-white/8 bg-white/[0.045] shadow-[0_0_24px_rgba(103,232,249,0.08)] backdrop-blur-xl transition-colors duration-300 hover:border-cyan-100/28 hover:bg-cyan-100/10 hover:text-cyan-50 ${color}`}
          style={{ left: x, top: y }}
          animate={motionEnabled ? { y: [0, -8, 0], rotate: [-3, 3, -3] } : false}
          transition={{ duration: 5.8, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="size-4 drop-shadow-[0_0_14px_currentColor]" strokeWidth={1.9} />
        </motion.div>
      ))}
    </motion.div>
  );
}

