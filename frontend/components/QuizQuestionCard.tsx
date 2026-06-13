"use client";

import { motion } from "framer-motion";
import type { QuizQuestion } from "@/types/quiz";
import { CodeSnippetBlock } from "@/components/CodeSnippetBlock";
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
  const { prose, code } = splitCodeFromText(question.question);

  return (
    <motion.article
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6 lg:p-7"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -22 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.8),transparent)]" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-xs font-extrabold uppercase text-cyan-100/72">
          Question {questionIndex + 1} / {totalQuestions}
        </span>
        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 font-sans text-xs font-bold text-white/54">
          {question.difficulty}
        </span>
      </div>

      <h2 className="font-sans text-xl font-semibold leading-snug text-white/92 sm:text-2xl lg:text-3xl">
        {prose}
      </h2>
      {code ? <CodeSnippetBlock code={code} /> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
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

function splitCodeFromText(text: string): { prose: string; code: string | null } {
  const fenced = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fenced) {
    return {
      prose: text.replace(fenced[0], "").trim() || "Review the code and choose the correct answer.",
      code: fenced[1].trim()
    };
  }

  const indicators = ["\n", "function ", "const ", "let ", "var ", "class ", "def ", "SELECT ", "git ", "npm ", "python ", "=>", "===", "console."];
  const looksLikeCode = indicators.some((indicator) => text.includes(indicator));
  if (!looksLikeCode) {
    return { prose: text, code: null };
  }

  const parts = text.split(/:\s*\n/);
  if (parts.length > 1) {
    return { prose: `${parts[0]}:`, code: parts.slice(1).join(":\n").trim() };
  }

  return { prose: "Analyze this snippet and choose the best answer.", code: text.trim() };
}

