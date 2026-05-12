"use client";

import { motion } from "framer-motion";

type AnimatedToggleSwitchProps = {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label: string;
};

export function AnimatedToggleSwitch({ checked, onToggle, label }: AnimatedToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onToggle(!checked)}
      className={`group relative inline-flex h-10 w-[76px] items-center rounded-full border p-1 outline-none backdrop-blur-xl transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        checked
          ? "border-cyan-100/45 bg-cyan-300/18 shadow-[0_0_34px_rgba(34,211,238,0.28)]"
          : "border-white/12 bg-white/[0.055] shadow-[0_14px_34px_rgba(0,0,0,0.24)]"
      }`}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <motion.span
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 55% 50%, rgba(167,243,208,0.22), rgba(34,211,238,0.12) 34%, transparent 68%)",
        }}
      />
      <motion.span
        className={`relative size-8 rounded-full border shadow-lg ${
          checked
            ? "border-cyan-100/55 bg-cyan-50 shadow-[0_0_20px_rgba(103,232,249,0.54)]"
            : "border-white/18 bg-white/14 shadow-black/25"
        }`}
        animate={{ x: checked ? 36 : 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.55 }}
      >
        <span
          className={`absolute inset-2 rounded-full transition-colors duration-300 ${
            checked ? "bg-slate-950/80" : "bg-cyan-100/42"
          }`}
        />
      </motion.span>
    </motion.button>
  );
}
