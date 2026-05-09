"use client";

import { motion } from "framer-motion";
import { Brain, CheckCircle2, Gauge, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedScoreCard } from "@/components/AnimatedScoreCard";
import type { QuizResult } from "@/types/quiz";

type QuizResultsScreenProps = {
  result: QuizResult;
  onRestart: () => void;
};

function getAnalysis(result: QuizResult, percentage: number): string {
  const topic = result.settings.prompt.trim() || result.quiz.title;
  if (percentage >= 85) {
    return `Excellent ${topic} understanding`;
  }
  if (percentage >= 65) {
    return `Strong ${topic} fundamentals`;
  }
  if (percentage >= 45) {
    return `Intermediate ${topic} knowledge`;
  }
  return `Developing ${topic} foundation`;
}

export function QuizResultsScreen({ result, onRestart }: QuizResultsScreenProps) {
  const correct = result.answers.filter((answer) => answer.isCorrect).length;
  const wrong = result.quiz.questions.length - correct;
  const percentage = Math.round((correct / result.quiz.questions.length) * 100);
  const averageTime =
    result.answers.length > 0
      ? Math.round(result.answers.reduce((sum, answer) => sum + answer.responseTime, 0) / result.answers.length)
      : 0;
  const analysis = getAnalysis(result, percentage);

  return (
    <motion.section
      className="relative z-10 grid min-h-dvh place-items-center px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 36, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -28, filter: "blur(10px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full max-w-5xl text-center">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <motion.span
            key={item}
            className="absolute left-1/2 top-20 size-2 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.9)]"
            animate={{
              x: [0, Math.cos(item) * 260],
              y: [0, Math.sin(item) * 150],
              opacity: [0, 1, 0],
              scale: [0.4, 1.4, 0.8]
            }}
            transition={{ duration: 2.8, repeat: Infinity, delay: item * 0.18, ease: "easeOut" }}
          />
        ))}

        <motion.div
          className="mx-auto grid size-28 place-items-center rounded-full border border-cyan-100/20 bg-white/[0.06] text-cyan-100 shadow-[0_0_52px_rgba(34,211,238,0.25)] backdrop-blur-2xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-12" strokeWidth={1.8} />
        </motion.div>

        <p className="mt-8 font-display text-xs font-extrabold uppercase text-cyan-100/76">Final results</p>
        <h2 className="mt-3 font-display text-5xl font-extrabold text-white sm:text-7xl">{percentage}%</h2>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-lg font-semibold leading-relaxed text-white/68 sm:text-xl">{analysis}</p>

        <div className="mt-8 grid gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <AnimatedScoreCard label="Correct" value={String(correct)} icon={<CheckCircle2 className="size-5" />} tone="text-emerald-100" />
          <AnimatedScoreCard label="Wrong" value={String(wrong)} icon={<XCircle className="size-5" />} tone="text-rose-100" />
          <AnimatedScoreCard label="Avg Response" value={`${averageTime}s`} icon={<Gauge className="size-5" />} />
          <AnimatedScoreCard label="Knowledge" value={result.settings.difficulty} icon={<Brain className="size-5" />} tone="text-fuchsia-100" />
        </div>

        <div className="mt-9 flex justify-center">
          <AnimatedButton onClick={onRestart}>
            <RotateCcw className="mr-3 size-4" />
            Create Again
          </AnimatedButton>
        </div>
      </div>
    </motion.section>
  );
}
