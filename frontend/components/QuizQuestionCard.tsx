"use client";

import { motion } from "framer-motion";
import type { QuizQuestion } from "@/types/quiz";
import { QuizChoiceBox } from "@/components/QuizChoiceBox";

type QuizQuestionCardProps = {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelect: (choice: string) => void;
};

export function QuizQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelect
}: QuizQuestionCardProps) {
  const revealed = selectedAnswer !== null;

  return (
    <motion.article
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-7"
      initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -22, filter: "blur(10px)" }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.8),transparent)]" />
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="font-display text-xs font-extrabold uppercase text-cyan-100/72">
          Question {questionIndex + 1} / {totalQuestions}
        </span>
        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 font-sans text-xs font-bold text-white/54">
          {question.difficulty}
        </span>
      </div>

      <h2 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl">
        {question.question}
      </h2>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {question.choices.map((choice) => (
          <QuizChoiceBox
            key={choice}
            choice={choice}
            selected={choice === selectedAnswer}
            correct={choice === question.correct_answer}
            revealed={revealed}
            disabled={revealed}
            onSelect={() => onSelect(choice)}
          />
        ))}
      </div>
    </motion.article>
  );
}
