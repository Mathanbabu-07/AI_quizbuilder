"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ComponentType, MouseEvent, ReactNode, SVGProps } from "react";
import { useRef } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";

type MagneticNavButtonProps = {
  children: ReactNode;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  ariaLabel: string;
  onClick?: () => void;
  compact?: boolean;
  circular?: boolean;
  tone?: "cyan" | "emerald" | "fuchsia";
};

const toneClasses = {
  cyan: "hover:border-cyan-200/45 hover:bg-cyan-200/12 focus-visible:ring-cyan-200",
  emerald: "hover:border-emerald-200/45 hover:bg-emerald-200/12 focus-visible:ring-emerald-200",
  fuchsia: "hover:border-fuchsia-200/45 hover:bg-fuchsia-200/12 focus-visible:ring-fuchsia-200"
};

export function MagneticNavButton({
  children,
  icon: Icon,
  ariaLabel,
  onClick,
  compact = false,
  circular = false,
  tone = "cyan"
}: MagneticNavButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.35 });
  const finePointer = useFinePointer();
  const boundsRef = useRef<DOMRect | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!finePointer) {
      return;
    }

    const rect = boundsRef.current ?? event.currentTarget.getBoundingClientRect();
    boundsRef.current = rect;
    x.set((event.clientX - rect.left - rect.width / 2) * 0.08);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.12);
  };

  const reset = () => {
    boundsRef.current = null;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={(event) => {
        boundsRef.current = event.currentTarget.getBoundingClientRect();
      }}
      onMouseMove={finePointer ? handleMouseMove : undefined}
      onMouseLeave={reset}
      onBlur={reset}
      style={{ x: springX, y: springY }}
      className={`group relative isolate inline-flex h-11 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.075] font-display text-xs font-bold uppercase text-white/90 shadow-[0_10px_32px_rgba(0,0,0,0.24)] outline-none backdrop-blur-2xl transition-colors duration-300 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-12 ${toneClasses[tone]} ${
        circular ? "size-11 rounded-full px-0 sm:size-12" : "rounded-xl px-3 sm:px-5"
      } ${compact ? "gap-0 sm:gap-2" : "gap-2"}`}
      whileHover={{ y: -2, scale: 1.035 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_48%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute left-1/2 top-1/2 -z-10 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/0 blur-2xl transition-colors duration-300 group-hover:bg-cyan-200/18" />
      <Icon className="size-4 text-cyan-100/90 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.2} />
      {circular ? null : <span className={compact ? "hidden sm:inline" : ""}>{children}</span>}
    </motion.button>
  );
}
