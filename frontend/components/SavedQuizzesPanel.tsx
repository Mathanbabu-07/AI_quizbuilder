"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, FileText, Trash2 } from "lucide-react";
import type { SavedManualQuizSummary } from "@/types/manualQuiz";

type SavedQuizzesPanelProps = {
  quizzes: SavedManualQuizSummary[];
  loading?: boolean;
  onOpen: (quizId: string) => void;
  onDelete: (quizId: string) => void;
};

export function SavedQuizzesPanel({ quizzes, loading = false, onOpen, onDelete }: SavedQuizzesPanelProps) {
  return (
    <aside className="rounded-[1.7rem] border border-white/12 bg-white/[0.055] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-100/72">
            Saved Quizzes
          </p>
          <p className="mt-1 text-xs font-semibold text-white/38">This device only</p>
        </div>
        <FileText className="size-5 text-cyan-100/64" />
      </div>

      {loading ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center text-xs font-semibold text-white/46">
          Loading saved drafts...
        </p>
      ) : quizzes.length ? (
        <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                layout
                exit={{ opacity: 0, x: -18, scale: 0.96, filter: "blur(8px)" }}
                className="group rounded-2xl border border-white/10 bg-slate-950/24 p-3 transition-colors duration-200 hover:border-cyan-100/26 hover:bg-cyan-100/[0.055]"
              >
                <button type="button" onClick={() => onOpen(quiz.id)} className="block w-full text-left">
                  <p className="truncate font-display text-sm font-extrabold text-white">{quiz.title}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/42">
                    <Clock3 className="size-3.5" />
                    {quiz.question_count} questions
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(quiz.id)}
                  className="mt-3 inline-flex h-8 items-center gap-2 rounded-xl border border-rose-100/10 bg-rose-100/[0.045] px-3 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-rose-100/58 transition-all duration-200 hover:border-rose-100/30 hover:text-rose-50"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center text-xs font-semibold text-white/42">
          Saved quizzes will stay here until you delete them.
        </p>
      )}
    </aside>
  );
}
