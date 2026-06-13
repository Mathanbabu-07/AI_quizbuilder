"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const messages = [
  "Generating intelligent questions...",
  "Training your quiz arena...",
  "Optimizing challenge difficulty...",
  "Building knowledge battlefield...",
  "Calibrating AI quiz engine..."
];

type QuizLoadingScreenProps = {
  progress?: number;
  stage?: string;
};

export function QuizLoadingScreen({ progress, stage }: QuizLoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const displayProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <motion.section
      className="relative z-10 grid min-h-dvh place-items-center px-5 py-24 text-center sm:px-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative flex w-full max-w-xl flex-col items-center">
        <motion.div
          className="absolute size-72 rounded-full bg-cyan-300/12 blur-3xl"
          animate={{ scale: [1, 1.14, 1], opacity: [0.42, 0.8, 0.42] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative grid size-48 place-items-center rounded-full border border-cyan-100/18 bg-white/[0.045] shadow-[0_0_68px_rgba(34,211,238,0.24)] backdrop-blur-2xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-4 rounded-full border border-dashed border-cyan-100/34"
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-10 rounded-full border border-fuchsia-100/24"
            animate={{ rotate: -360, scale: [1, 1.05, 1] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="grid size-24 place-items-center rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(103,232,249,0.48)_42%,rgba(14,165,233,0.1)_76%)] shadow-[0_0_44px_rgba(103,232,249,0.72)]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrainCircuit className="size-10 text-slate-950" strokeWidth={1.8} />
          </motion.div>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <motion.span
              key={item}
              className="absolute size-2 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.9)]"
              style={{ originX: 24, x: 96 }}
              animate={{ rotate: item * 60 + 360 }}
              transition={{ duration: 5.4, repeat: Infinity, ease: "linear", delay: item * 0.08 }}
            />
          ))}
        </motion.div>

        <motion.div
          className="mt-10 flex items-center gap-2 font-display text-xs font-extrabold uppercase text-cyan-100/78"
          animate={{ opacity: [0.62, 1, 0.62] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="size-4" />
          {stage || "AI generation in progress"}
        </motion.div>

        <motion.p
          key={messageIndex}
          className="relative mt-4 min-h-8 font-sans text-xl font-semibold text-white/74 sm:text-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
        >
          {messages[messageIndex]}
          {displayProgress !== null ? (
            <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-base font-semibold text-white/74 sm:text-lg">
              {displayProgress}%
            </span>
          ) : null}
        </motion.p>

        <div className="mt-8 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9,#a78bfa,#f0abfc)]"
            animate={{ x: ["-100%", "115%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "56%" }}
          />
        </div>
      </div>
    </motion.section>
  );
}

