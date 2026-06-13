"use client";

import { motion } from "framer-motion";
import { BookOpenText, CheckSquare, FilePenLine, ListChecks, ShieldCheck, type LucideIcon } from "lucide-react";
import { SavedQuizzesPanel } from "@/components/SavedQuizzesPanel";
import type { ManualQuestionType, SavedManualQuizSummary } from "@/types/manualQuiz";

type QuestionTypeSelectionProps = {
  savedQuizzes: SavedManualQuizSummary[];
  loadingSaved: boolean;
  onSelect: (type: ManualQuestionType) => void;
  onOpenSaved: (quizId: string) => void;
  onDeleteSaved: (quizId: string) => void;
};

const options: Array<{
  type: ManualQuestionType;
  title: string;
  label: string;
  Icon: LucideIcon;
  enabled: boolean;
}> = [
  { type: "mcq", title: "Multiple Choice", label: "MCQ", Icon: ListChecks, enabled: true },
  { type: "multiselect", title: "Multiselect", label: "Multiple answers", Icon: CheckSquare, enabled: false },
  { type: "true_false", title: "True or False", label: "Binary rounds", Icon: ShieldCheck, enabled: false },
  { type: "fill_blank", title: "Fill in the Blanks", label: "Text answers", Icon: FilePenLine, enabled: false },
  { type: "passage", title: "Passage", label: "Reading set", Icon: BookOpenText, enabled: false }
];

export function QuestionTypeSelection({
  savedQuizzes,
  loadingSaved,
  onSelect,
  onOpenSaved,
  onDeleteSaved
}: QuestionTypeSelectionProps) {
  return (
    <motion.section
      className="relative z-10 min-h-dvh px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 34 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto grid w-full max-w-[88rem] gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <SavedQuizzesPanel
          quizzes={savedQuizzes}
          loading={loadingSaved}
          onOpen={onOpenSaved}
          onDelete={onDeleteSaved}
        />

        <div className="flex min-h-[62dvh] flex-col items-center justify-center text-center">
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-100/76">
            Question Type
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-6xl">
            Choose Your Format
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-white/48 sm:text-base">
            Start with a manual MCQ builder now. Other question engines are scaffolded for the next expansion.
          </p>

          <div className="mt-10 grid w-full max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {options.map(({ type, title, label, Icon, enabled }, index) => (
              <motion.button
                key={type}
                type="button"
                onClick={() => enabled && onSelect(type)}
                className={`group relative isolate min-h-44 overflow-hidden rounded-[1.6rem] border p-5 text-left shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-colors duration-300 ${
                  enabled
                    ? "border-cyan-100/22 bg-white/[0.065] hover:border-cyan-100/44"
                    : "cursor-not-allowed border-white/8 bg-white/[0.035] opacity-58"
                }`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.045, duration: 0.38 }}
                whileHover={enabled ? { y: -5, scale: 1.02 } : undefined}
                whileTap={enabled ? { scale: 0.98 } : undefined}
              >
                <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.18),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <motion.span
                  className="mb-6 grid size-12 place-items-center rounded-2xl border border-cyan-100/18 bg-cyan-100/10 text-cyan-50"
                  animate={enabled ? { y: [0, -4, 0] } : false}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                >
                  <Icon className="size-5" />
                </motion.span>
                <p className="font-display text-lg font-extrabold text-white">{title}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/42">{label}</p>
                {!enabled ? (
                  <span className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/36">
                    Soon
                  </span>
                ) : null}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

