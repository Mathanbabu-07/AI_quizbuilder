"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type NumberPadProps = {
  disabled: boolean;
  selectedNumber: number | null;
  onPick: (value: number) => void;
};

const numbers = [1, 2, 3, 4, 5, 6];

export const NumberPad = memo(function NumberPad({ disabled, selectedNumber, onPick }: NumberPadProps) {
  return (
    <div className="mx-auto grid w-full max-w-xl grid-cols-3 gap-3 sm:gap-4">
      {numbers.map((number) => (
        <motion.button
          key={number}
          type="button"
          disabled={disabled}
          onClick={() => onPick(number)}
          className={`group relative isolate h-16 overflow-hidden rounded-2xl border font-display text-2xl font-extrabold text-white shadow-[0_14px_42px_rgba(0,0,0,0.28)] outline-none backdrop-blur-xl transition-colors duration-300 hover:border-cyan-100/52 hover:bg-cyan-100/14 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed sm:h-20 sm:text-3xl ${
            selectedNumber === number
              ? "border-emerald-100/62 bg-emerald-100/18 opacity-100"
              : "border-cyan-100/20 bg-white/[0.09] disabled:opacity-45"
          }`}
          whileHover={disabled ? undefined : { y: -3, scale: 1.025 }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 430, damping: 28 }}
        >
          <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.22),transparent_56%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute inset-x-5 bottom-0 h-px bg-cyan-100/70 opacity-70" />
          {number}
        </motion.button>
      ))}
    </div>
  );
});
