"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CircularTimer } from "@/components/CircularTimer";
import { QuizQuestionCard } from "@/components/QuizQuestionCard";
import type { GeneratedQuiz, QuizAnswer, QuizResult, QuizSettings } from "@/types/quiz";

type QuizGameScreenProps = {
  quiz: GeneratedQuiz;
  settings: QuizSettings;
  onComplete: (result: QuizResult) => void;
};

export function QuizGameScreen({ quiz, settings, onComplete }: QuizGameScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(settings.timePerQuestion);
  const [totalTimeLeft, setTotalTimeLeft] = useState(settings.totalQuizTime * 60);
  const questionStartedAt = useRef(Date.now());
  const advancingRef = useRef(false);
  const completedRef = useRef(false);

  const currentQuestion = quiz.questions[currentIndex];

  const completeQuiz = (finalAnswers: QuizAnswer[]) => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    onComplete({ quiz, settings, answers: finalAnswers });
  };

  const advance = (finalAnswers: QuizAnswer[]) => {
    if (currentIndex >= quiz.questions.length - 1) {
      completeQuiz(finalAnswers);
      return;
    }

    setCurrentIndex((index) => index + 1);
  };

  const recordAnswer = (choice: string | null) => {
    if (advancingRef.current || selectedAnswer !== null || completedRef.current) {
      return;
    }

    advancingRef.current = true;
    const answer: QuizAnswer = {
      questionIndex: currentIndex,
      selectedAnswer: choice,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect: choice === currentQuestion.correct_answer,
      responseTime: Math.max(1, Math.round((Date.now() - questionStartedAt.current) / 1000))
    };

    const finalAnswers = [...answers, answer];
    setAnswers(finalAnswers);
    setSelectedAnswer(choice ?? "__timeout__");

    window.setTimeout(() => {
      advance(finalAnswers);
    }, choice ? 1400 : 900);
  };

  useEffect(() => {
    questionStartedAt.current = Date.now();
    advancingRef.current = false;
    setSelectedAnswer(null);
    setQuestionTimeLeft(settings.timePerQuestion);
  }, [currentIndex, settings.timePerQuestion]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuestionTimeLeft((value) => Math.max(0, value - 1));
      setTotalTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (questionTimeLeft === 0 && selectedAnswer === null) {
      recordAnswer(null);
    }
  }, [questionTimeLeft, selectedAnswer]);

  useEffect(() => {
    if (totalTimeLeft === 0 && !completedRef.current) {
      completeQuiz(answers);
    }
  }, [totalTimeLeft, answers]);

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-col items-center justify-between gap-5 sm:mb-7 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-display text-xs font-extrabold uppercase text-cyan-100/72">Live quiz arena</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl">{quiz.title}</h1>
          </div>
          <div className="flex scale-90 gap-3 sm:scale-100 sm:gap-4">
            <CircularTimer value={questionTimeLeft} max={settings.timePerQuestion} label="Question" />
            <CircularTimer value={totalTimeLeft} max={settings.totalQuizTime * 60} label="Total" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <QuizQuestionCard
            key={currentQuestion.question}
            question={currentQuestion}
            questionIndex={currentIndex}
            totalQuestions={quiz.questions.length}
            selectedAnswer={selectedAnswer}
            onSelect={recordAnswer}
          />
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

