"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { floatLoop, heroContainer, heroItem } from "@/animations/motionPresets";
import { CreateQuizPanel } from "@/components/CreateQuizPanel";
import { QuizGameScreen } from "@/components/QuizGameScreen";
import { QuizLoadingScreen } from "@/components/QuizLoadingScreen";
import { QuizResultsScreen } from "@/components/QuizResultsScreen";
import { QuizReviewPanel } from "@/components/QuizReviewPanel";
import { generateQuiz } from "@/lib/quizApi";
import type { GeneratedQuiz, QuizResult, QuizSettings } from "@/types/quiz";
import { CreateButton } from "@/ui/CreateButton";
import { JoinButton } from "@/ui/JoinButton";
import { SettingsButton } from "@/ui/SettingsButton";

type Screen = "home" | "create" | "loading" | "review" | "game" | "results";

export function HeroSection() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (nextSettings: QuizSettings) => {
    if (nextSettings.prompt.length < 3) {
      setErrorMessage("Add a quiz topic before generating your arena.");
      return;
    }

    setErrorMessage(null);
    setSettings(nextSettings);
    setScreen("loading");

    try {
      const generatedQuiz = await generateQuiz(nextSettings);
      setQuiz(generatedQuiz);
      setScreen("review");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The AI engine could not generate this quiz.");
      setScreen("create");
    }
  };

  const resetFlow = () => {
    setQuiz(null);
    setSettings(null);
    setResult(null);
    setErrorMessage(null);
    setScreen("create");
  };

  return (
    <div className="relative z-10 min-h-dvh">
      <div className="absolute right-5 top-5 flex items-center gap-3 sm:right-8 sm:top-8">
        <JoinButton />
        <SettingsButton />
      </div>

      <AnimatePresence mode="wait">
        {screen === "home" ? (
          <motion.section
            key="home"
            className="grid min-h-dvh place-items-center px-5 py-8 sm:px-8"
            exit={{ opacity: 0, y: -72, scale: 0.97, filter: "blur(16px)" }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mx-auto flex w-full max-w-5xl flex-col items-center text-center"
              variants={heroContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={heroItem}>
                <motion.h1
                  className="inline-block bg-[linear-gradient(95deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,1)_26%,rgba(186,230,253,0.96)_52%,rgba(255,255,255,0.98)_78%,rgba(255,255,255,0.94)_100%)] bg-[length:220%_100%] bg-clip-text font-display text-6xl font-extrabold leading-[0.82] tracking-[0.18em] text-transparent drop-shadow-[0_0_18px_rgba(148,163,184,0.18)] sm:text-8xl md:text-9xl lg:text-[9.25rem]"
                  animate={{
                    y: floatLoop.y,
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    y: floatLoop.transition,
                    backgroundPosition: {
                      duration: 9,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  GENQUIZ
                </motion.h1>
              </motion.div>

              <motion.p
                className="mt-6 max-w-2xl font-sans text-lg font-medium uppercase tracking-[0.45em] text-white/58 sm:text-xl md:text-2xl"
                variants={heroItem}
              >
                Your AI Playground
              </motion.p>

              <motion.div className="mt-10 sm:mt-12" variants={heroItem}>
                <CreateButton onClick={() => setScreen("create")} />
              </motion.div>
            </motion.div>
          </motion.section>
        ) : screen === "create" ? (
          <CreateQuizPanel key="create" errorMessage={errorMessage} onGenerate={handleGenerate} />
        ) : screen === "loading" ? (
          <QuizLoadingScreen key="loading" />
        ) : screen === "review" && quiz && settings ? (
          <QuizReviewPanel key="review" quiz={quiz} settings={settings} onStart={() => setScreen("game")} />
        ) : screen === "game" && quiz && settings ? (
          <QuizGameScreen
            key="game"
            quiz={quiz}
            settings={settings}
            onComplete={(nextResult) => {
              setResult(nextResult);
              setScreen("results");
            }}
          />
        ) : screen === "results" && result ? (
          <QuizResultsScreen key="results" result={result} onRestart={resetFlow} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
