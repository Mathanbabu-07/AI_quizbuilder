"use client";

import { motion } from "framer-motion";
import { Brain, FileUp, Gamepad2, Hash, Link2, MessageSquareText, Mic, Timer, Trophy, UserRound, UsersRound, Waves } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedInput } from "@/components/AnimatedInput";
import { AnimatedSelect } from "@/components/AnimatedSelect";
import { FloatingGlow } from "@/components/FloatingGlow";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
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
  multiplayerEnabled: boolean;
  onMultiplayerChange: (enabled: boolean) => void;
  onGenerate: (settings: QuizSettings) => void;
  onOpenFileQuiz?: () => void;
  onOpenUrlQuiz?: () => void;
};

function CreateQuizPanelComponent({
  errorMessage,
  multiplayerEnabled,
  onMultiplayerChange,
  onGenerate,
  onOpenFileQuiz,
  onOpenUrlQuiz
}: CreateQuizPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [questions, setQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timePerQuestion, setTimePerQuestion] = useState("30");
  const [pointsPerQuestion, setPointsPerQuestion] = useState("1");
  const promptBaseRef = useRef("");
  const {
    supported,
    isListening,
    finalTranscript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening
  } = useSpeechRecognition();

  useEffect(() => {
    if (!isListening && !finalTranscript && !interimTranscript) {
      return;
    }

    const transcript = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
    const nextValue = [promptBaseRef.current, transcript].filter(Boolean).join(" ").trim();
    setPrompt(nextValue);
  }, [finalTranscript, interimTranscript, isListening]);

  const handleSubmit = () => {
    const questionCount = Number(questions);
    const secondsPerQuestion = Number(timePerQuestion);

    onGenerate({
      prompt: prompt.trim(),
      questionCount,
      difficulty,
      timePerQuestion: secondsPerQuestion,
      totalQuizTime: Math.max(1, Math.ceil((questionCount * secondsPerQuestion) / 60)),
      pointsPerQuestion: Number(pointsPerQuestion)
    });
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    promptBaseRef.current = prompt.trim();
    startListening();
  };

  const voiceStatus = useMemo(
    () =>
      voiceError
        ? voiceError
        : isListening
          ? interimTranscript
            ? "Transcribing your quiz idea..."
            : "Listening for your quiz prompt..."
          : supported
            ? "Use voice to describe the quiz you want to generate."
            : "Voice prompting is not available in this browser.",
    [interimTranscript, isListening, supported, voiceError]
  );

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh items-start justify-center px-4 pb-12 pt-24 sm:items-center sm:px-8 sm:py-24"
      initial={{ opacity: 0, y: 42, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 28, scale: 0.98 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.form
        className="relative w-full max-w-5xl pt-16 sm:pt-0"
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
        {onOpenFileQuiz || onOpenUrlQuiz ? (
          <div className="absolute left-0 top-0 z-20 flex items-center gap-1.5 sm:gap-2">
            {onOpenFileQuiz ? (
              <motion.button
                type="button"
                onClick={onOpenFileQuiz}
                className="group relative flex size-12 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] border border-cyan-100/18 bg-white/[0.065] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.14)] outline-none backdrop-blur-2xl transition-colors hover:border-cyan-100/38 hover:bg-cyan-100/12 focus-visible:ring-2 focus-visible:ring-cyan-200/70 sm:size-16 sm:rounded-2xl"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Generate quiz from PDF or PPTX"
              >
                <span className="absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.3),transparent_64%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <motion.span
                  className="absolute inset-1 rounded-[0.85rem] border border-cyan-100/10"
                  animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <FileUp className="relative size-4 sm:size-6" />
                <span className="relative font-display text-[0.55rem] font-extrabold uppercase leading-none tracking-[0.12em] text-cyan-50/78">
                  PDF
                </span>
              </motion.button>
            ) : null}
            {onOpenUrlQuiz ? (
              <motion.button
                type="button"
                onClick={onOpenUrlQuiz}
                className="group relative flex size-12 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] border border-fuchsia-100/18 bg-white/[0.065] text-fuchsia-100 shadow-[0_0_28px_rgba(217,70,239,0.14)] outline-none backdrop-blur-2xl transition-colors hover:border-fuchsia-100/38 hover:bg-fuchsia-100/12 focus-visible:ring-2 focus-visible:ring-fuchsia-200/70 sm:size-16 sm:rounded-2xl"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Generate quiz from URL"
              >
                <span className="absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(240,171,252,0.28),transparent_64%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <motion.span
                  className="absolute inset-1 rounded-[0.85rem] border border-fuchsia-100/10"
                  animate={{ opacity: [0.22, 0.82, 0.22], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <Link2 className="relative size-4 sm:size-6" />
                <span className="relative font-display text-[0.55rem] font-extrabold uppercase leading-none tracking-[0.12em] text-fuchsia-50/78">
                  URL
                </span>
              </motion.button>
            ) : null}
          </div>
        ) : null}

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
          <div className="mb-5 flex justify-center sm:justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.055] p-1 shadow-[0_16px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => onMultiplayerChange(false)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] transition-colors duration-200 ${
                  !multiplayerEnabled
                    ? "bg-cyan-100/14 text-cyan-50 shadow-[0_0_22px_rgba(103,232,249,0.16)]"
                    : "text-white/44 hover:text-white/72"
                }`}
              >
                <UserRound className="size-3.5" />
                Solo
              </button>
              <button
                type="button"
                onClick={() => onMultiplayerChange(true)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] transition-colors duration-200 ${
                  multiplayerEnabled
                    ? "bg-fuchsia-100/14 text-fuchsia-50 shadow-[0_0_22px_rgba(240,171,252,0.16)]"
                    : "text-white/44 hover:text-white/72"
                }`}
              >
                <UsersRound className="size-3.5" />
                Multiplayer
              </button>
            </div>
          </div>

          <AnimatedInput
            label="Quiz Prompt"
            value={prompt}
            onChange={setPrompt}
            placeholder="Generate a quiz about..."
            icon={<MessageSquareText className="size-4" strokeWidth={2.2} />}
            multiline
            action={
              <motion.button
                type="button"
                className={`group relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full border px-3 text-[0.68rem] font-bold uppercase outline-none transition-colors duration-300 ${
                  isListening
                    ? "border-cyan-100/42 bg-cyan-100/12 text-cyan-50 shadow-[0_0_24px_rgba(103,232,249,0.24)]"
                    : "border-white/12 bg-white/[0.045] text-white/56 hover:border-cyan-100/30 hover:text-cyan-50"
                }`}
                onClick={toggleListening}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                disabled={!supported}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.24),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <motion.span
                  className={`grid size-7 place-items-center rounded-full ${
                    isListening ? "bg-cyan-100/18 text-cyan-50" : "bg-white/[0.06] text-cyan-100/80"
                  }`}
                  animate={isListening ? { scale: [1, 1.08, 1] } : false}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isListening ? <Waves className="size-3.5" strokeWidth={2.1} /> : <Mic className="size-3.5" strokeWidth={2.1} />}
                </motion.span>
                <span className="hidden sm:inline">{isListening ? "Listening" : "Voice"}</span>
              </motion.button>
            }
            helper={
              <div className="flex min-h-6 items-center gap-3 font-sans text-xs font-semibold text-white/48">
                <div className="flex items-end gap-1">
                  {[0, 1, 2].map((bar) => (
                    <motion.span
                      key={bar}
                      className={`block w-1 rounded-full ${isListening ? "bg-cyan-100" : "bg-white/18"}`}
                      animate={isListening ? { height: [6, 16 + bar * 3, 6] } : { height: 6 }}
                      transition={{
                        duration: 0.8,
                        repeat: isListening ? Infinity : 0,
                        repeatType: "mirror",
                        delay: bar * 0.08,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
                <span className={voiceError ? "text-rose-200/86" : isListening ? "text-cyan-100/86" : ""}>
                  {voiceStatus}
                </span>
              </div>
            }
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
              label="Points Per Question"
              value={pointsPerQuestion}
              onChange={setPointsPerQuestion}
              icon={<Trophy className="size-4" strokeWidth={2.2} />}
              type="number"
              min={1}
              max={10}
              suffix="pts"
            />
          </div>
        </motion.div>

        <motion.div
          className="mt-9 flex flex-col items-center justify-center gap-3"
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } }
          }}
        >
          <AnimatedButton type="submit">
            <Gamepad2 className="mr-3 size-4" />
            {multiplayerEnabled ? "Generate Arena" : "Generate & Play"}
          </AnimatedButton>
          <p className="text-center font-sans text-xs font-semibold text-white/42">
            {multiplayerEnabled
              ? "Multiplayer creates a room code and host review screen."
              : "Solo mode starts the quiz immediately after AI generation."}
          </p>
        </motion.div>
      </motion.form>
    </motion.section>
  );
}

export const CreateQuizPanel = memo(CreateQuizPanelComponent);

