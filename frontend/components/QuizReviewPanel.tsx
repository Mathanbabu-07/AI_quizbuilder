"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, ShieldCheck } from "lucide-react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { HostParticipantsPanel } from "@/components/HostParticipantsPanel";
import { MultiplayerCodePanel } from "@/components/MultiplayerCodePanel";
import { MultiplayerToggle } from "@/components/MultiplayerToggle";
import type { HostRoomController } from "@/hooks/useHostRoom";
import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

type QuizReviewPanelProps = {
  quiz: GeneratedQuiz;
  settings: QuizSettings;
  multiplayerEnabled: boolean;
  roomCode: string | null;
  hostRoom: HostRoomController;
  onMultiplayerToggle: (enabled: boolean) => void;
  onStart: () => void;
  hostOnly?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export function QuizReviewPanel({
  quiz,
  settings,
  multiplayerEnabled,
  roomCode,
  hostRoom,
  onMultiplayerToggle,
  onStart,
  hostOnly = false,
  secondaryAction
}: QuizReviewPanelProps) {
  const multiplayerReady = !multiplayerEnabled || (hostRoom.status === "active" && Boolean(hostRoom.roomState?.quiz));

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh justify-center px-4 py-20 sm:px-8 sm:py-24 xl:px-10"
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
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
            <MultiplayerToggle enabled={multiplayerEnabled} onToggle={onMultiplayerToggle} />
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

        {hostOnly ? (
          <div className="order-4 min-w-0 rounded-3xl border border-cyan-100/16 bg-cyan-100/[0.055] p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl xl:col-start-2">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100/72">
              Saved Arena Loaded
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/52">
              Room code and participants are ready for hosting.
            </p>
          </div>
        ) : (
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
        )}

        <div className="order-5 sticky bottom-5 mt-4 flex justify-center xl:col-start-2">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="h-12 rounded-2xl border border-white/12 bg-white/[0.055] px-5 font-display text-xs font-extrabold uppercase tracking-[0.14em] text-white/64 backdrop-blur-xl transition-colors hover:border-cyan-100/26 hover:text-white"
              >
                {secondaryAction.label}
              </button>
            ) : null}
            <AnimatedButton onClick={onStart} disabled={!multiplayerReady}>
              <Play className="mr-3 size-4" />
              {multiplayerReady ? "Start Now" : "Syncing Arena"}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

