"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { heroContainer, heroItem } from "@/animations/motionPresets";
import { AboutGQSection } from "@/components/AboutGQSection";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { CreateQuizPanel } from "@/components/CreateQuizPanel";
import { FloatingTitle } from "@/components/FloatingTitle";
import { NavigationBar } from "@/components/NavigationBar";
import { QuizGameScreen } from "@/components/QuizGameScreen";
import { QuizLoadingScreen } from "@/components/QuizLoadingScreen";
import { QuizResultsScreen } from "@/components/QuizResultsScreen";
import { QuizReviewPanel } from "@/components/QuizReviewPanel";
import { generateQuiz } from "@/lib/quizApi";
import type { GeneratedQuiz, QuizResult, QuizSettings } from "@/types/quiz";
import { CreateButton } from "@/ui/CreateButton";

type Screen = "home" | "create" | "loading" | "review" | "game" | "results";

export function HeroSection() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);

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

  const showAbout = () => {
    if (screen !== "home") {
      setScreen("home");
      window.setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }

    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative z-10 min-h-svh">
      <NavigationBar onCreateQuiz={() => setScreen("create")} onAbout={showAbout} />

      <AnimatePresence mode="wait">
        {screen === "home" ? (
          <motion.div
            key="home"
            exit={{ opacity: 0, y: -72, scale: 0.97, filter: "blur(16px)" }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <section className="flex min-h-[100svh] items-start justify-center px-4 pb-14 pt-[9.25rem] sm:min-h-svh sm:items-center sm:px-8 sm:py-24">
              <motion.div
                className="mx-auto flex w-full max-w-5xl flex-col items-center text-center"
                variants={heroContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="relative flex flex-col items-center" variants={heroItem}>
                  <AnimatedLogo />
                  <FloatingTitle />
                </motion.div>

                <motion.p
                  className="mt-5 max-w-2xl font-sans text-sm font-medium uppercase tracking-[0.28em] text-white/64 sm:mt-6 sm:text-xl sm:tracking-[0.45em] md:text-2xl"
                  variants={heroItem}
                >
                  Your AI Playground
                </motion.p>

                <motion.div className="mt-8 sm:mt-12" variants={heroItem}>
                  <CreateButton onClick={() => setScreen("create")} />
                </motion.div>
              </motion.div>
            </section>
            <AboutGQSection sectionRef={aboutRef} />
          </motion.div>
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
