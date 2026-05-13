"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

type AnimatedButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export function AnimatedButton({ children, type = "button", onClick, disabled = false }: AnimatedButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.35 });

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = (event.clientX - rect.left - rect.width / 2) * 0.16;
    const nextY = (event.clientY - rect.top - rect.height / 2) * 0.22;

    x.set(nextX);
    y.set(nextY);
  };

  const resetMagnet = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group relative isolate inline-flex h-16 min-w-56 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100/35 px-9 font-display text-sm font-extrabold uppercase text-white shadow-[0_0_44px_rgba(34,211,238,0.28),0_18px_58px_rgba(0,0,0,0.38)] outline-none backdrop-blur-xl transition-colors duration-300 hover:border-white/60 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-cyan-100/35"
      style={{ x: springX, y: springY }}
      onMouseMove={disabled ? undefined : handleMouseMove}
      onMouseLeave={resetMagnet}
      onBlur={resetMagnet}
      whileHover={disabled ? undefined : { scale: 1.045, rotate: -0.4 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(45,212,191,0.94),rgba(14,165,233,0.86),rgba(168,85,247,0.82),rgba(244,114,182,0.78),rgba(45,212,191,0.94))] bg-[length:260%_100%] motion-safe:animate-[shine_4.8s_linear_infinite]" />
      <span className="absolute inset-[1px] -z-10 rounded-[15px] bg-slate-950/34 transition-colors duration-300 group-hover:bg-slate-950/18" />
      <span className="absolute left-1/2 top-1/2 -z-10 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/26 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <span className="absolute inset-x-8 bottom-0 h-px bg-white/90 blur-[1px]" />
      <Sparkles className="mr-3 size-4 text-cyan-50 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" strokeWidth={2.4} />
      <span>{children}</span>
    </motion.button>
  );
}
