"use client";

import { motion } from "framer-motion";
import { Play, ShieldCheck } from "lucide-react";
import { AnimatedButton } from "@/components/AnimatedButton";
import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

type QuizReviewPanelProps = {
  quiz: GeneratedQuiz;
  settings: QuizSettings;
  onStart: () => void;
};

export function QuizReviewPanel({ quiz, settings, onStart }: QuizReviewPanelProps) {
  return (
    <motion.section
      className="relative z-10 flex min-h-dvh justify-center px-5 py-24 sm:px-8"
      initial={{ opacity: 0, y: 36, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -28, filter: "blur(10px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <p className="font-display text-xs font-extrabold uppercase text-cyan-100/76">Quiz arena ready</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold text-white sm:text-6xl">{quiz.title}</h2>
          <p className="mt-4 font-sans text-sm font-semibold text-white/52">
            {quiz.questions.length} questions | {settings.difficulty} | {settings.timePerQuestion}s each
          </p>
        </div>

        <div className="grid gap-5">
          {quiz.questions.map((question, index) => (
            <motion.article
              key={question.question}
              className="rounded-3xl border border-white/12 bg-white/[0.055] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-colors duration-300 hover:border-cyan-100/28 sm:p-6"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.42 }}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="font-display text-xs font-extrabold uppercase text-cyan-100/70">
                  Question {index + 1}
                </span>
                <span className="flex items-center gap-2 rounded-full border border-emerald-100/14 bg-emerald-100/8 px-3 py-1 font-sans text-xs font-bold text-emerald-100/78">
                  <ShieldCheck className="size-3.5" />
                  {question.difficulty}
                </span>
              </div>
              <h3 className="font-sans text-lg font-bold text-white sm:text-xl">{question.question}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {question.choices.map((choice) => (
                  <div
                    key={choice}
                    className={`rounded-2xl border px-4 py-3 font-sans text-sm font-semibold ${
                      choice === question.correct_answer
                        ? "border-emerald-100/36 bg-emerald-100/10 text-emerald-50"
                        : "border-white/10 bg-white/[0.04] text-white/62"
                    }`}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="sticky bottom-5 mt-9 flex justify-center">
          <AnimatedButton onClick={onStart}>
            <Play className="mr-3 size-4" />
            Start Quiz
          </AnimatedButton>
        </div>
      </div>
    </motion.section>
  );
}
