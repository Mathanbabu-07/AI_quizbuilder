"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { heroContainer, heroItem } from "@/animations/motionPresets";
import { AboutGQSection } from "@/components/AboutGQSection";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { CreateQuizPanel } from "@/components/CreateQuizPanel";
import { FloatingTitle } from "@/components/FloatingTitle";
import { JoinQuizModal } from "@/components/JoinQuizModal";
import { NavigationBar } from "@/components/NavigationBar";
import { QuizGameScreen } from "@/components/QuizGameScreen";
import { QuizLoadingScreen } from "@/components/QuizLoadingScreen";
import { QuizResultsScreen } from "@/components/QuizResultsScreen";
import { QuizReviewPanel } from "@/components/QuizReviewPanel";
import { WaitingRoom } from "@/components/WaitingRoom";
import { MultiplayerResultsWaiting } from "@/components/MultiplayerResultsWaiting";
import { generateRoomCode } from "@/components/RoomCodeGenerator";
import { useHostRoom } from "@/hooks/useHostRoom";
import { useParticipantRoom } from "@/hooks/useParticipantRoom";
import { generateQuiz } from "@/lib/quizApi";
import type { GeneratedQuiz, QuizResult, QuizSettings } from "@/types/quiz";
import { CreateButton } from "@/ui/CreateButton";

type Screen = "home" | "create" | "loading" | "review" | "game" | "results" | "waiting" | "resultsWaiting";

export function HeroSection() {
  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const hostRoom = useHostRoom(multiplayerEnabled, roomCode, quiz, settings);
  const participantRoom = useParticipantRoom();
  const aboutRef = useRef<HTMLElement | null>(null);
  const isParticipantSession = Boolean(participantRoom.participantId);

  useEffect(() => {
    const room = participantRoom.roomState;
    if (screen === "waiting" && room?.status === "started" && room.quiz && room.settings) {
      setQuiz(room.quiz);
      setSettings(room.settings);
      setScreen("game");
    }
  }, [participantRoom.roomState, screen]);

  useEffect(() => {
    const room = participantRoom.roomState;
    const hostState = hostRoom.roomState;
    if (screen === "resultsWaiting" && result && (room?.all_finished || hostState?.all_finished)) {
      setScreen("results");
    }
  }, [hostRoom.roomState, participantRoom.roomState, result, screen]);

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
      if (multiplayerEnabled) {
        setRoomCode(generateRoomCode());
        setScreen("review");
        return;
      }

      setScreen("game");
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
    setMultiplayerEnabled(false);
    setRoomCode(null);
    participantRoom.leaveRoom();
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

  const handleJoinRoom = async (roomCode: string) => {
    const joined = await participantRoom.joinRoom(roomCode);
    if (joined) {
      setJoinModalOpen(false);
      setScreen("waiting");
    }
    return joined;
  };

  const leaveWaitingRoom = () => {
    participantRoom.leaveRoom();
    setScreen("home");
  };

  const handleMultiplayerToggle = (enabled: boolean) => {
    setMultiplayerEnabled(enabled);
    setRoomCode(enabled ? generateRoomCode() : null);
  };

  const handleStartQuiz = async () => {
    if (!quiz || !settings) {
      return;
    }

    if (multiplayerEnabled) {
      const started = await hostRoom.startRoom(quiz, settings);
      if (!started) {
        return;
      }
    }

    setScreen("game");
  };

  const handleGameComplete = async (nextResult: QuizResult) => {
    setResult(nextResult);

    if (isParticipantSession) {
      const syncedRoom = await participantRoom.submitResult(nextResult);
      if (syncedRoom?.all_finished) {
        setScreen("results");
      } else {
        setScreen("resultsWaiting");
      }
      return;
    }

    if (multiplayerEnabled) {
      const syncedRoom = await hostRoom.submitResult(nextResult);
      if (syncedRoom?.all_finished) {
        setScreen("results");
      } else {
        setScreen("resultsWaiting");
      }
      return;
    }

    setScreen("results");
  };

  return (
    <div className="relative z-10 min-h-svh">
      <NavigationBar onCreateQuiz={() => setScreen("create")} onAbout={showAbout} onJoinQuiz={() => setJoinModalOpen(true)} />

      <JoinQuizModal
        open={joinModalOpen}
        isJoining={participantRoom.status === "joining"}
        errorMessage={participantRoom.errorMessage}
        onClose={() => setJoinModalOpen(false)}
        onJoin={handleJoinRoom}
      />

      <AnimatePresence mode="wait">
        {screen === "home" ? (
          <motion.div
            key="home"
            exit={{ opacity: 0, y: -72, scale: 0.97, filter: "blur(16px)" }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <section className="flex min-h-[100svh] items-start justify-center px-4 pb-14 pt-[11rem] sm:min-h-svh sm:items-center sm:px-8 sm:py-24">
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
          <CreateQuizPanel
            key="create"
            errorMessage={errorMessage}
            multiplayerEnabled={multiplayerEnabled}
            onMultiplayerChange={setMultiplayerEnabled}
            onGenerate={handleGenerate}
          />
        ) : screen === "loading" ? (
          <QuizLoadingScreen key="loading" />
        ) : screen === "review" && quiz && settings ? (
          <QuizReviewPanel
            key="review"
            quiz={quiz}
            settings={settings}
            multiplayerEnabled={multiplayerEnabled}
            roomCode={roomCode}
            hostRoom={hostRoom}
            onMultiplayerToggle={handleMultiplayerToggle}
            onStart={handleStartQuiz}
          />
        ) : screen === "waiting" && participantRoom.roomState && participantRoom.participantId ? (
          <WaitingRoom
            key="waiting"
            room={participantRoom.roomState}
            participantId={participantRoom.participantId}
            onUpdateName={participantRoom.updateName}
            onLeave={leaveWaitingRoom}
          />
        ) : screen === "game" && quiz && settings ? (
          <QuizGameScreen
            key="game"
            quiz={quiz}
            settings={settings}
            onComplete={handleGameComplete}
          />
        ) : screen === "resultsWaiting" && (participantRoom.roomState || hostRoom.roomState) ? (
          <MultiplayerResultsWaiting key="resultsWaiting" room={(participantRoom.roomState ?? hostRoom.roomState)!} />
        ) : screen === "results" && result ? (
          <QuizResultsScreen
            key="results"
            result={result}
            onRestart={resetFlow}
            leaderboard={participantRoom.roomState?.leaderboard ?? hostRoom.roomState?.leaderboard ?? []}
            currentParticipantId={participantRoom.participantId}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
