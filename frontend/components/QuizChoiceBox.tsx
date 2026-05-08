"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

type QuizChoiceBoxProps = {
  choice: string;
  selected: boolean;
  correct: boolean;
  revealed: boolean;
  disabled: boolean;
  onSelect: () => void;
};

export function QuizChoiceBox({ choice, selected, correct, revealed, disabled, onSelect }: QuizChoiceBoxProps) {
  const stateClass = revealed
    ? correct
      ? "border-emerald-200/70 bg-emerald-300/14 shadow-[0_0_36px_rgba(52,211,153,0.28)]"
      : selected
        ? "border-rose-200/70 bg-rose-300/14 shadow-[0_0_36px_rgba(251,113,133,0.25)]"
        : "border-white/10 bg-white/[0.045] opacity-55"
    : "border-white/12 bg-white/[0.065] hover:border-cyan-100/36 hover:bg-cyan-100/10 hover:shadow-[0_0_28px_rgba(34,211,238,0.16)]";

  return (
    <motion.button
      type="button"
      className={`group relative flex min-h-20 w-full items-center justify-between rounded-2xl border px-5 py-4 text-left font-sans text-base font-semibold text-white outline-none backdrop-blur-2xl transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${stateClass}`}
      onClick={onSelect}
      disabled={disabled}
      whileHover={!disabled ? { y: -2, scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      animate={selected && revealed && !correct ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <span className="pr-4">{choice}</span>
      {revealed && correct ? <Check className="size-5 shrink-0 text-emerald-100" /> : null}
      {revealed && selected && !correct ? <X className="size-5 shrink-0 text-rose-100" /> : null}
    </motion.button>
  );
}
