"use client";

import { motion } from "framer-motion";
import { Brain, Hash, Hourglass, MessageSquareText, Timer } from "lucide-react";
import { useState } from "react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedInput } from "@/components/AnimatedInput";
import { AnimatedSelect } from "@/components/AnimatedSelect";
import { FloatingGlow } from "@/components/FloatingGlow";
import type { Difficulty, QuizSettings } from "@/types/quiz";

const questionOptions = Array.from({ length: 9 }, (_, index) => {
  const value = String(10 + index * 5);
  return { label: `${value} questions`, value };
});

const difficultyOptions = [
  { label: "Easy", value: "Easy", tone: "text-emerald-100" },
  { label: "Medium", value: "Medium", tone: "text-cyan-100" },
  { label: "Hard", value: "Hard", tone: "text-amber-100" },
  { label: "Very Hard", value: "Very Hard", tone: "text-rose-100" }
];

type CreateQuizPanelProps = {
  errorMessage?: string | null;
  onGenerate: (settings: QuizSettings) => void;
};

export function CreateQuizPanel({ errorMessage, onGenerate }: CreateQuizPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [questions, setQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timePerQuestion, setTimePerQuestion] = useState("30");
  const [totalTime, setTotalTime] = useState("10");

  const handleSubmit = () => {
    onGenerate({
      prompt: prompt.trim(),
      questionCount: Number(questions),
      difficulty,
      timePerQuestion: Number(timePerQuestion),
      totalQuizTime: Number(totalTime)
    });
  };

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 42, scale: 0.97, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.form
        className="relative w-full max-w-5xl"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { delayChildren: 0.1, staggerChildren: 0.08 }
          }
        }}
      >
        <FloatingGlow className="-left-12 top-10 size-44 bg-cyan-300/14" />
        <FloatingGlow className="-right-16 bottom-24 size-52 bg-fuchsia-300/12" />

        <motion.div
          className="mb-8 text-center"
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }
          }}
        >
          <p className="font-display text-xs font-extrabold uppercase text-cyan-100/76 drop-shadow-[0_0_16px_rgba(103,232,249,0.38)]">
            BUILD WITH AI
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-white sm:text-5xl md:text-6xl">
            Generate a Quiz
          </h2>
          {errorMessage ? (
            <motion.p
              className="mx-auto mt-5 max-w-2xl rounded-2xl border border-rose-200/20 bg-rose-300/10 px-4 py-3 font-sans text-sm font-semibold text-rose-50 shadow-[0_0_30px_rgba(251,113,133,0.12)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.p>
          ) : null}
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 22 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }
          }}
        >
          <AnimatedInput
            label="Quiz Prompt"
            value={prompt}
            onChange={setPrompt}
            placeholder="Generate a quiz about..."
            icon={<MessageSquareText className="size-4" strokeWidth={2.2} />}
            multiline
          />
        </motion.div>

        <motion.div
          className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5"
          variants={{
            hidden: { opacity: 0, y: 22 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }
          }}
        >
          <div className="grid gap-4 md:gap-5">
            <AnimatedSelect
              label="Number of Questions"
              value={questions}
              options={questionOptions}
              onChange={setQuestions}
              icon={Hash}
            />
            <AnimatedSelect
              label="Difficulty"
              value={difficulty}
              options={difficultyOptions}
              onChange={(value) => setDifficulty(value as Difficulty)}
              icon={Brain}
            />
          </div>

          <div className="grid gap-4 md:gap-5">
            <AnimatedInput
              label="Time Per Question"
              value={timePerQuestion}
              onChange={setTimePerQuestion}
              icon={<Timer className="size-4" strokeWidth={2.2} />}
              type="number"
              min={5}
              max={300}
              suffix="sec"
            />
            <AnimatedInput
              label="Total Quiz Time"
              value={totalTime}
              onChange={setTotalTime}
              icon={<Hourglass className="size-4" strokeWidth={2.2} />}
              type="number"
              min={1}
              max={120}
              suffix="min"
            />
          </div>
        </motion.div>

        <motion.div
          className="mt-9 flex justify-center"
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }
          }}
        >
          <AnimatedButton type="submit">Generate</AnimatedButton>
        </motion.div>
      </motion.form>
    </motion.section>
  );
}
