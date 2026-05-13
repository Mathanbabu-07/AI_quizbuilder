"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { memo, useMemo } from "react";
import { CodeSnippetBlock } from "@/components/CodeSnippetBlock";

type QuizChoiceBoxProps = {
  choice: string;
  selected: boolean;
  correct: boolean;
  revealed: boolean;
  disabled: boolean;
  onSelect: () => void;
};

function QuizChoiceBoxComponent({ choice, selected, correct, revealed, disabled, onSelect }: QuizChoiceBoxProps) {
  const { prose, code } = useMemo(() => splitCodeFromText(choice), [choice]);
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
      className={`group relative flex min-h-20 w-full items-center justify-between rounded-2xl border px-4 py-4 text-left font-sans text-[0.95rem] font-semibold leading-relaxed text-white outline-none backdrop-blur-2xl transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-5 sm:text-base ${stateClass}`}
      onClick={onSelect}
      disabled={disabled}
      whileHover={!disabled ? { y: -2, scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      animate={selected && revealed && !correct ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <span className="min-w-0 flex-1 pr-4">
        {prose}
        {code ? <CodeSnippetBlock code={code} copyable={false} /> : null}
      </span>
      {revealed && correct ? <Check className="size-5 shrink-0 text-emerald-100" /> : null}
      {revealed && selected && !correct ? <X className="size-5 shrink-0 text-rose-100" /> : null}
    </motion.button>
  );
}

export const QuizChoiceBox = memo(QuizChoiceBoxComponent);

function splitCodeFromText(text: string): { prose: string; code: string | null } {
  const fenced = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fenced) {
    return { prose: text.replace(fenced[0], "").trim(), code: fenced[1].trim() };
  }

  const looksLikeCode = text.includes("\n") || text.includes("=>") || text.includes("===") || text.includes("console.");
  return looksLikeCode ? { prose: "", code: text.trim() } : { prose: text, code: null };
}
