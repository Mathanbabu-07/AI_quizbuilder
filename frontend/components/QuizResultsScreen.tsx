"use client";

import { motion } from "framer-motion";
import { Award, Brain, CheckCircle2, Crown, Gauge, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedScoreCard } from "@/components/AnimatedScoreCard";
import type { ParticipantState } from "@/types/multiplayer";
import type { QuizResult } from "@/types/quiz";

type QuizResultsScreenProps = {
  result: QuizResult;
  onRestart: () => void;
  leaderboard?: ParticipantState[];
  currentParticipantId?: string | null;
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

export function QuizResultsScreen({ result, onRestart, leaderboard = [], currentParticipantId }: QuizResultsScreenProps) {
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
      className="relative z-10 flex min-h-dvh items-start justify-center px-4 pb-10 pt-16 sm:grid sm:place-items-center sm:px-8 sm:py-24"
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full max-w-5xl text-center">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <motion.span
            key={item}
            className="absolute left-1/2 top-12 size-1.5 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.9)] sm:top-20 sm:size-2"
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
          className="mx-auto grid size-20 place-items-center rounded-full border border-cyan-100/20 bg-white/[0.06] text-cyan-100 shadow-[0_0_52px_rgba(34,211,238,0.25)] backdrop-blur-2xl sm:size-28"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-9 sm:size-12" strokeWidth={1.8} />
        </motion.div>

        <p className="mt-5 font-display text-xs font-extrabold uppercase text-cyan-100/76 sm:mt-8">Final results</p>
        <h2 className="mt-2 font-display text-5xl font-extrabold text-white sm:mt-3 sm:text-7xl">{percentage}%</h2>
        <p className="mx-auto mt-3 max-w-[22rem] break-words font-sans text-base font-semibold leading-snug text-white/68 sm:mt-4 sm:max-w-2xl sm:text-xl sm:leading-relaxed">{analysis}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <AnimatedScoreCard label="Correct" value={String(correct)} icon={<CheckCircle2 className="size-5" />} tone="text-emerald-100" />
          <AnimatedScoreCard label="Wrong" value={String(wrong)} icon={<XCircle className="size-5" />} tone="text-rose-100" />
          <AnimatedScoreCard label="Avg Response" value={`${averageTime}s`} icon={<Gauge className="size-5" />} />
          <AnimatedScoreCard label="Knowledge" value={result.settings.difficulty} icon={<Brain className="size-5" />} tone="text-fuchsia-100" />
        </div>

        {leaderboard.length > 0 ? (
          <motion.div
            className="mx-auto mt-6 max-w-3xl rounded-[1.5rem] border border-white/12 bg-slate-950/34 p-3 text-left shadow-[0_22px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:mt-9 sm:rounded-[2rem] sm:p-5"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.45 }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-100/76">
                  Multiplayer leaderboard
                </p>
                <h3 className="mt-2 font-display text-xl font-extrabold text-white sm:text-2xl">Arena Rankings</h3>
              </div>
              <Award className="size-7 text-fuchsia-100/72" />
            </div>

            <div className="grid gap-2.5">
              {leaderboard.map((player, index) => {
                const isCurrent = player.id === currentParticipantId;
                const isWinner = index === 0;

                return (
                  <motion.div
                    key={player.id}
                    className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl border px-3 py-2.5 sm:gap-3 sm:py-3 sm:px-4 ${
                      isWinner
                        ? "border-amber-100/30 bg-amber-100/[0.09] shadow-[0_0_34px_rgba(251,191,36,0.12)]"
                        : isCurrent
                          ? "border-cyan-100/26 bg-cyan-100/[0.075]"
                          : "border-white/10 bg-white/[0.045]"
                    }`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.32 }}
                  >
                    <div className="grid size-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] font-display text-sm font-extrabold text-white">
                      {isWinner ? <Crown className="size-4 text-amber-100" /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-extrabold uppercase tracking-[0.08em] text-white">
                        {player.name}
                        {isCurrent ? <span className="ml-2 text-cyan-100/72">(YOU)</span> : null}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white/45">
                        {player.accuracy ?? 0}% accuracy | Avg {player.average_response_time ?? 0}s
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-extrabold text-white">{player.score ?? 0}</p>
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/40">Score</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        <div className="mt-6 flex justify-center sm:mt-9">
          <AnimatedButton onClick={onRestart}>
            <RotateCcw className="mr-3 size-4" />
            Create Again
          </AnimatedButton>
        </div>
      </div>
    </motion.section>
  );
}

