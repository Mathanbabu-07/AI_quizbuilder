"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { heroContainer, heroItem } from "@/animations/motionPresets";
import { AboutGQSection } from "@/components/AboutGQSection";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { CreateQuizPanel } from "@/components/CreateQuizPanel";
import { FloatingTitle } from "@/components/FloatingTitle";
import { JoinQuizModal } from "@/components/JoinQuizModal";
import { ManualQuizBuilder } from "@/components/ManualQuizBuilder";
import { NavigationBar } from "@/components/NavigationBar";
import { QuestionTypeSelection } from "@/components/QuestionTypeSelection";
import { QuizGameScreen } from "@/components/QuizGameScreen";
import { QuizLoadingScreen } from "@/components/QuizLoadingScreen";
import { QuizResultsScreen } from "@/components/QuizResultsScreen";
import { QuizReviewPanel } from "@/components/QuizReviewPanel";
import { WaitingRoom } from "@/components/WaitingRoom";
import { MultiplayerResultsWaiting } from "@/components/MultiplayerResultsWaiting";
import { generateRoomCode } from "@/components/RoomCodeGenerator";
import { useDeviceHostId } from "@/hooks/useDeviceHostId";
import { useHostRoom } from "@/hooks/useHostRoom";
import { useParticipantRoom } from "@/hooks/useParticipantRoom";
import { deleteManualQuiz, getManualQuiz, listManualQuizzes, saveManualQuiz } from "@/lib/manualQuizApi";
import { generateQuiz } from "@/lib/quizApi";
import {
  manualQuizToGeneratedQuiz,
  manualQuizToSettings,
  type ManualQuizDraft,
  type ManualQuizQuestion,
  type ManualQuestionType,
  type SavedManualQuizSummary
} from "@/types/manualQuiz";
import type { GeneratedQuiz, QuizResult, QuizSettings } from "@/types/quiz";
import { CreateButton } from "@/ui/CreateButton";

type Screen =
  | "home"
  | "questionTypes"
  | "manualMcq"
  | "create"
  | "loading"
  | "review"
  | "game"
  | "results"
  | "waiting"
  | "resultsWaiting";

type CreationMode = "ai" | "manual" | null;

const routableScreens: Screen[] = [
  "home",
  "questionTypes",
  "manualMcq",
  "create",
  "loading",
  "review",
  "game",
  "results",
  "waiting",
  "resultsWaiting"
];

function modeForScreen(nextScreen: Screen): CreationMode {
  if (nextScreen === "create" || nextScreen === "loading") {
    return "ai";
  }

  if (nextScreen === "questionTypes" || nextScreen === "manualMcq") {
    return "manual";
  }

  return null;
}

function readScreenFromUrl(): Screen {
  if (typeof window === "undefined") {
    return "home";
  }

  const view = new URLSearchParams(window.location.search).get("view");
  return routableScreens.includes(view as Screen) ? (view as Screen) : "home";
}

function routeForScreen(nextScreen: Screen) {
  return nextScreen === "home" ? "/" : `/?view=${nextScreen}`;
}

export function HeroSection() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [manualDraft, setManualDraft] = useState<ManualQuizDraft | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedManualQuizSummary[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const hostId = useDeviceHostId();
  const hostRoom = useHostRoom(multiplayerEnabled, roomCode, quiz, settings);
  const participantRoom = useParticipantRoom();
  const aboutRef = useRef<HTMLElement | null>(null);
  const isParticipantSession = Boolean(participantRoom.participantId);

  const goToScreen = useCallback(
    (nextScreen: Screen, options?: { replace?: boolean }) => {
      setScreen(nextScreen);
      const nextMode = modeForScreen(nextScreen);
      if (nextScreen === "home") {
        setCreationMode(null);
      } else if (nextMode) {
        setCreationMode(nextMode);
      }

      if (typeof window === "undefined") {
        return;
      }

      const nextRoute = routeForScreen(nextScreen);
      const currentRoute = `${window.location.pathname}${window.location.search}`;
      if (currentRoute === nextRoute) {
        return;
      }

      if (options?.replace) {
        router.replace(nextRoute, { scroll: false });
        return;
      }

      router.push(nextRoute, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const initialScreen = readScreenFromUrl();
    setScreen(initialScreen);
    const initialMode = modeForScreen(initialScreen);
    setCreationMode(initialScreen === "home" ? null : initialMode);

    if (initialScreen === "home" && window.location.search) {
      router.replace("/", { scroll: false });
    }

    const handlePopState = () => {
      const nextScreen = readScreenFromUrl();
      setScreen(nextScreen);
      const nextMode = modeForScreen(nextScreen);
      setCreationMode(nextScreen === "home" ? null : nextMode);
      setErrorMessage(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const openAiFlow = () => {
    participantRoom.leaveRoom();
    setCreationMode("ai");
    setQuiz(null);
    setSettings(null);
    setResult(null);
    setManualDraft(null);
    setRoomCode(null);
    setMultiplayerEnabled(false);
    setErrorMessage(null);
    goToScreen("create");
  };

  const openManualFlow = () => {
    participantRoom.leaveRoom();
    setCreationMode("manual");
    setQuiz(null);
    setSettings(null);
    setResult(null);
    setManualDraft(null);
    setRoomCode(null);
    setMultiplayerEnabled(false);
    setErrorMessage(null);
    goToScreen("questionTypes");
  };

  useEffect(() => {
    const room = participantRoom.roomState;
    if (screen === "waiting" && room?.status === "started" && room.quiz && room.settings) {
      setQuiz(room.quiz);
      setSettings(room.settings);
      goToScreen("game");
    }
  }, [goToScreen, participantRoom.roomState, screen]);

  useEffect(() => {
    const room = participantRoom.roomState;
    const hostState = hostRoom.roomState;
    if (screen === "resultsWaiting" && result && (room?.all_finished || hostState?.all_finished)) {
      goToScreen("results");
    }
  }, [goToScreen, hostRoom.roomState, participantRoom.roomState, result, screen]);

  useEffect(() => {
    if (!hostId || !["questionTypes", "manualMcq"].includes(screen)) {
      return;
    }

    setSavedLoading(true);
    listManualQuizzes(hostId)
      .then(setSavedQuizzes)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "Could not load saved quizzes."))
      .finally(() => setSavedLoading(false));
  }, [hostId, screen]);

  const handleGenerate = async (nextSettings: QuizSettings) => {
    if (nextSettings.prompt.length < 3) {
      setErrorMessage("Add a quiz topic before generating your arena.");
      return;
    }

    setErrorMessage(null);
    setSettings(nextSettings);
    setCreationMode("ai");
    setScreen("loading");

    try {
      const generatedQuiz = await generateQuiz(nextSettings);
      setQuiz(generatedQuiz);
      if (multiplayerEnabled) {
        setRoomCode(generateRoomCode());
        goToScreen("review");
        return;
      }

      goToScreen("game");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The AI engine could not generate this quiz.");
      goToScreen("create");
    }
  };

  const resetFlow = () => {
    setQuiz(null);
    setSettings(null);
    setResult(null);
    setErrorMessage(null);
    setMultiplayerEnabled(false);
    setRoomCode(null);
    setManualDraft(null);
    participantRoom.leaveRoom();
    if (creationMode === "ai") {
      goToScreen("create");
      return;
    }
    if (creationMode === "manual") {
      goToScreen("questionTypes");
      return;
    }
    goToScreen("home");
  };

  const showAbout = () => {
    if (screen !== "home") {
      goToScreen("home");
      window.setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }

    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleJoinRoom = async (roomCode: string) => {
    const joined = await participantRoom.joinRoom(roomCode);
    if (joined) {
      setJoinModalOpen(false);
      goToScreen("waiting");
    }
    return joined;
  };

  const openManualBuilder = (type: ManualQuestionType) => {
    if (type !== "mcq") {
      return;
    }

    setManualDraft(null);
    setErrorMessage(null);
    setCreationMode("manual");
    goToScreen("manualMcq");
  };

  const openSavedQuiz = async (quizId: string) => {
    if (!hostId) {
      setErrorMessage("Saved quizzes are still preparing on this device.");
      return;
    }

    try {
      const saved = await getManualQuiz(quizId, hostId);
      setManualDraft({
        id: saved.id,
        title: saved.title,
        targetQuestionCount: saved.question_count,
        questions: saved.questions.map((question, index) => ({
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.options,
          correct_answers: question.correct_answers,
          points: question.points,
          time_limit: question.time_limit,
          order_index: index
        }))
      });
      setErrorMessage(null);
      setCreationMode("manual");
      goToScreen("manualMcq");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open saved quiz.");
    }
  };

  const removeSavedQuiz = async (quizId: string) => {
    if (!hostId) {
      return;
    }

    try {
      await deleteManualQuiz(quizId, hostId);
      setSavedQuizzes((items) => items.filter((item) => item.id !== quizId));
      if (manualDraft?.id === quizId) {
        setManualDraft(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not delete saved quiz.");
    }
  };

  const saveManualDraft = async (draft: ManualQuizDraft) => {
    if (!hostId) {
      setErrorMessage("This device profile is still preparing. Try again in a moment.");
      return;
    }

    setManualSaving(true);
    setErrorMessage(null);
    try {
      const payloadQuestions: ManualQuizQuestion[] = draft.questions.map((question, index) => ({
        ...question,
        order_index: index
      }));
      const nextRoomCode = generateRoomCode();
      const saved = await saveManualQuiz(
        {
          host_id: hostId,
          title: draft.title,
          questionType: "mcq",
          multiplayer: true,
          roomCode: nextRoomCode,
          questions: payloadQuestions.map((question) => ({
            question: question.question_text,
            options: question.options,
            correctAnswer: question.correct_answers[0] ?? question.options[0] ?? "",
            timePerQuestion: question.time_limit,
            points: question.points
          }))
        },
        draft.id
      );
      const nextDraft = {
        id: saved.id,
        title: saved.title,
        targetQuestionCount: payloadQuestions.length,
        questions: saved.questions.map((question, index) => ({ ...question, order_index: index }))
      };

      setManualDraft(nextDraft);
      setQuiz(manualQuizToGeneratedQuiz(nextDraft));
      setSettings(manualQuizToSettings(nextDraft));
      setCreationMode("manual");
      setMultiplayerEnabled(true);
      setRoomCode(saved.room_code ?? nextRoomCode);
      goToScreen("review");
      setSavedQuizzes((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save manual quiz.");
    } finally {
      setManualSaving(false);
    }
  };

  const leaveWaitingRoom = () => {
    participantRoom.leaveRoom();
    goToScreen("home");
  };

  const handleMultiplayerToggle = (enabled: boolean) => {
    setMultiplayerEnabled(enabled);
    setRoomCode(enabled ? generateRoomCode() : null);
  };

  const handleSaveStartLater = () => {
    setCreationMode("manual");
    setMultiplayerEnabled(false);
    setRoomCode(null);
    goToScreen("questionTypes");
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

    goToScreen("game");
  };

  const handleGameComplete = async (nextResult: QuizResult) => {
    setResult(nextResult);

    if (isParticipantSession) {
      const syncedRoom = await participantRoom.submitResult(nextResult);
      if (syncedRoom?.all_finished) {
        goToScreen("results");
      } else {
        goToScreen("resultsWaiting");
      }
      return;
    }

    if (multiplayerEnabled) {
      const syncedRoom = await hostRoom.submitResult(nextResult);
      if (syncedRoom?.all_finished) {
        goToScreen("results");
      } else {
        goToScreen("resultsWaiting");
      }
      return;
    }

    goToScreen("results");
  };

  return (
    <div className="relative z-10 min-h-svh">
      <NavigationBar isHome={screen === "home"} onAbout={showAbout} onJoinQuiz={() => setJoinModalOpen(true)} />

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
            <section className="relative isolate flex min-h-[100svh] items-start justify-center overflow-hidden px-4 pb-14 pt-[11rem] sm:min-h-svh sm:items-center sm:px-8 sm:py-24">
              <motion.div
                className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center"
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

                <motion.div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4" variants={heroItem}>
                  <CreateButton mode="ai" onClick={openAiFlow} />
                  <CreateButton mode="manual" onClick={openManualFlow} />
                </motion.div>
              </motion.div>
            </section>
            <AboutGQSection sectionRef={aboutRef} />
          </motion.div>
        ) : screen === "questionTypes" ? (
          <QuestionTypeSelection
            key="questionTypes"
            savedQuizzes={savedQuizzes}
            loadingSaved={savedLoading}
            onSelect={openManualBuilder}
            onOpenSaved={openSavedQuiz}
            onDeleteSaved={removeSavedQuiz}
          />
        ) : screen === "manualMcq" ? (
          <ManualQuizBuilder
            key={manualDraft?.id ?? "newManualQuiz"}
            initialDraft={manualDraft}
            savedQuizzes={savedQuizzes}
            loadingSaved={savedLoading}
            saving={manualSaving}
            errorMessage={errorMessage}
            onOpenSaved={openSavedQuiz}
            onDeleteSaved={removeSavedQuiz}
            onSaveQuiz={saveManualDraft}
          />
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
            secondaryAction={
              manualDraft
                ? {
                    label: "Save & Start Later",
                    onClick: handleSaveStartLater
                  }
                : undefined
            }
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
