"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, ShieldCheck } from "lucide-react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { HostParticipantsPanel } from "@/components/HostParticipantsPanel";
import { MultiplayerCodePanel } from "@/components/MultiplayerCodePanel";
import { MultiplayerToggle } from "@/components/MultiplayerToggle";
import { generateRoomCode } from "@/components/RoomCodeGenerator";
import { useHostRoom } from "@/hooks/useHostRoom";
import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

type QuizReviewPanelProps = {
  quiz: GeneratedQuiz;
  settings: QuizSettings;
  onStart: () => void;
};

export function QuizReviewPanel({ quiz, settings, onStart }: QuizReviewPanelProps) {
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const hostRoom = useHostRoom(multiplayerEnabled, roomCode);

  const handleMultiplayerToggle = (enabled: boolean) => {
    setMultiplayerEnabled(enabled);

    if (enabled) {
      setRoomCode(generateRoomCode());
    }
  };

  const handleStart = () => {
    if (multiplayerEnabled) {
      void hostRoom.startRoom();
    }
    onStart();
  };

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh justify-center px-4 py-20 sm:px-8 sm:py-24 xl:px-10"
      initial={{ opacity: 0, y: 36, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -28, filter: "blur(10px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid w-full max-w-[94rem] gap-5 xl:grid-cols-[minmax(250px,300px)_minmax(0,1fr)_minmax(280px,340px)] xl:items-start">
        <div className="order-2 xl:order-1 xl:row-span-3 xl:sticky xl:top-28">
          <AnimatePresence mode="popLayout">
            {multiplayerEnabled && roomCode ? <MultiplayerCodePanel key={roomCode} code={roomCode} /> : null}
          </AnimatePresence>
        </div>

        <div className="order-1 min-w-0 xl:order-2">
          <div className="mx-auto mb-6 max-w-md">
            <MultiplayerToggle enabled={multiplayerEnabled} onToggle={handleMultiplayerToggle} />
          </div>

          <div className="text-center">
            <p className="font-display text-xs font-extrabold uppercase text-cyan-100/76">Quiz arena ready</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {quiz.title}
            </h2>
            <p className="mt-4 font-sans text-sm font-semibold text-white/52">
              {quiz.questions.length} questions | {settings.difficulty} | {settings.timePerQuestion}s each
            </p>
          </div>
        </div>

        <div className="order-3 xl:row-span-3 xl:sticky xl:top-28">
          <AnimatePresence>
            {multiplayerEnabled ? (
              <HostParticipantsPanel
                room={hostRoom.roomState}
                status={hostRoom.status}
                errorMessage={hostRoom.errorMessage}
                className="xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto"
              />
            ) : null}
          </AnimatePresence>
        </div>

        <div className="order-4 grid min-w-0 gap-5 xl:col-start-2">
          {quiz.questions.map((question, index) => (
            <motion.article
              key={question.question}
              className="rounded-3xl border border-white/12 bg-white/[0.055] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-colors duration-300 hover:border-cyan-100/28 sm:p-6"
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
              <h3 className="font-sans text-base font-semibold leading-relaxed text-white/88 sm:text-lg">{question.question}</h3>
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

        <div className="order-5 sticky bottom-5 mt-4 flex justify-center xl:col-start-2">
          <AnimatedButton onClick={handleStart}>
            <Play className="mr-3 size-4" />
            Start Quiz
          </AnimatedButton>
        </div>
      </div>
    </motion.section>
  );
}
