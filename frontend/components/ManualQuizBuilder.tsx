"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronRight, Clock3, Hash, Save, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SavedQuizzesPanel } from "@/components/SavedQuizzesPanel";
import type { ManualQuizDraft, ManualQuizQuestion, SavedManualQuizSummary } from "@/types/manualQuiz";

type ManualQuizBuilderProps = {
  initialDraft?: ManualQuizDraft | null;
  savedQuizzes: SavedManualQuizSummary[];
  loadingSaved: boolean;
  saving: boolean;
  errorMessage?: string | null;
  onOpenSaved: (quizId: string) => void;
  onDeleteSaved: (quizId: string) => void;
  onSaveQuiz: (draft: ManualQuizDraft) => Promise<void> | void;
};

type CurrentQuestionState = {
  question_text: string;
  options: string[];
  correctIndex: number | null;
  points: string;
  time_limit: string;
};

const emptyQuestion: CurrentQuestionState = {
  question_text: "",
  options: ["", "", "", ""],
  correctIndex: null,
  points: "1",
  time_limit: "30"
};

export function ManualQuizBuilder({
  initialDraft,
  savedQuizzes,
  loadingSaved,
  saving,
  errorMessage,
  onOpenSaved,
  onDeleteSaved,
  onSaveQuiz
}: ManualQuizBuilderProps) {
  const [quizId, setQuizId] = useState<string | undefined>(initialDraft?.id);
  const [title, setTitle] = useState(initialDraft?.title ?? "Untitled GENQUIZ Arena");
  const [targetQuestionCount, setTargetQuestionCount] = useState(String(initialDraft?.targetQuestionCount ?? 10));
  const [questions, setQuestions] = useState<ManualQuizQuestion[]>(initialDraft?.questions ?? []);
  const [current, setCurrent] = useState<CurrentQuestionState>(emptyQuestion);
  const [warning, setWarning] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!initialDraft) {
      return;
    }

    setQuizId(initialDraft.id);
    setTitle(initialDraft.title);
    setTargetQuestionCount(String(initialDraft.targetQuestionCount ?? Math.max(10, initialDraft.questions.length || 10)));
    setQuestions(initialDraft.questions);
    setCurrent(emptyQuestion);
    setWarning(null);
  }, [initialDraft]);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      return;
    }

    const compact = window.matchMedia("(max-width: 639px)").matches;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(compact ? 190 : 340, Math.max(compact ? 118 : 170, textarea.scrollHeight))}px`;
  }, [current.question_text]);

  const targetCount = clampQuestionCount(Number(targetQuestionCount));
  const currentIsComplete = canConvertCurrent(current);
  const finalizedCount = questions.length + (currentIsComplete ? 1 : 0);
  const atLimit = questions.length >= targetCount;
  const readyToSave = finalizedCount === targetCount;
  const saveNextDisabled = atLimit || saving;
  const statusMessage = warning ?? errorMessage;
  const isBackendError = Boolean(errorMessage && !warning);

  const draft = useMemo<ManualQuizDraft>(() => {
    const finalized = currentIsComplete && questions.length < targetCount ? [...questions, toQuestion(current, questions.length)] : questions;
    return {
      id: quizId,
      title: title.trim() || "Untitled GENQUIZ Arena",
      targetQuestionCount: targetCount,
      questions: finalized
    };
  }, [current, currentIsComplete, questions, quizId, targetCount, title]);

  const updateOption = (index: number, value: string) => {
    setCurrent((state) => ({
      ...state,
      options: state.options.map((option, optionIndex) => (optionIndex === index ? value : option))
    }));
  };

  const validateCurrent = () => {
    const trimmedQuestion = current.question_text.trim();
    const cleanedOptions = current.options.map((option) => option.trim());

    if (trimmedQuestion.length < 4) {
      return "Type a clear question before saving.";
    }
    if (cleanedOptions.some((option) => option.length < 1)) {
      return "Fill all 4 answer options.";
    }
    if (new Set(cleanedOptions.map((option) => option.toLowerCase())).size !== 4) {
      return "Answer options must be unique.";
    }
    if (current.correctIndex === null) {
      return "Select the correct answer before continuing.";
    }
    if (Number(current.points) < 1) {
      return "Points must be at least 1.";
    }
    if (Number(current.time_limit) < 5) {
      return "Time limit must be at least 5 seconds.";
    }

    return null;
  };

  const saveNext = () => {
    if (atLimit) {
      setWarning("Question limit reached. Save the quiz to continue to host verification.");
      return;
    }

    const nextWarning = validateCurrent();
    if (nextWarning) {
      setWarning(nextWarning);
      return;
    }

    setQuestions((items) => [...items, toQuestion(current, items.length)]);
    setCurrent(emptyQuestion);
    setWarning(null);
  };

  const saveQuiz = async () => {
    let nextDraft = draft;

    if (hasDraftContent(current) && questions.length < targetCount) {
      const nextWarning = validateCurrent();
      if (nextWarning) {
        setWarning(nextWarning);
        return;
      }
      nextDraft = {
        id: quizId,
        title: title.trim() || "Untitled GENQUIZ Arena",
        targetQuestionCount: targetCount,
        questions: [...questions, toQuestion(current, questions.length)]
      };
    }

    if (nextDraft.questions.length < targetCount) {
      setWarning(`Finish ${targetCount - nextDraft.questions.length} more question${targetCount - nextDraft.questions.length === 1 ? "" : "s"} before saving.`);
      return;
    }

    setWarning(null);
    await onSaveQuiz(nextDraft);
  };

  return (
    <motion.section
      className="relative z-10 min-h-dvh px-3 py-20 sm:px-8 sm:py-24"
      initial={{ opacity: 0, y: 34, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto grid w-full max-w-[92rem] gap-4 sm:gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <SavedQuizzesPanel
          quizzes={savedQuizzes}
          loading={loadingSaved}
          onOpen={onOpenSaved}
          onDelete={onDeleteSaved}
        />

        <div className="rounded-[1.4rem] border border-white/12 bg-slate-950/28 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block font-display text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cyan-100/72 sm:mb-2 sm:text-xs sm:tracking-[0.18em]">
                Quiz Title
              </span>
              <span className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.055] px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
                <Save className="size-4 shrink-0 text-cyan-100/68" />
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-display text-base font-extrabold text-white outline-none placeholder:text-white/26 sm:text-2xl"
                  placeholder="Quiz title"
                />
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[24rem]">
              <label className="rounded-xl border border-white/12 bg-white/[0.045] px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                <span className="mb-1.5 flex items-center justify-center gap-2 font-display text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/46 sm:mb-2 sm:text-xs sm:tracking-[0.18em]">
                  <Hash className="size-3.5 text-cyan-100/58" />
                  Needed Count
                </span>
                <input
                  value={targetQuestionCount}
                  type="number"
                  min={1}
                  max={100}
                  onChange={(event) => setTargetQuestionCount(event.target.value)}
                  className="w-full bg-transparent text-center font-display text-xl font-extrabold text-white outline-none sm:text-2xl"
                />
              </label>

              <div className="rounded-xl border border-white/12 bg-white/[0.045] px-3 py-2.5 text-center sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="font-display text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/46 sm:text-xs sm:tracking-[0.18em]">
                  Progress
                </p>
                <p className="mt-1 font-display text-xl font-extrabold text-white sm:text-2xl">
                  {Math.min(finalizedCount, targetCount)} / {targetCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10 sm:mb-6 sm:h-2">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200 will-change-transform"
              initial={false}
              animate={{ scaleX: Math.min(1, finalizedCount / targetCount) }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            />
          </div>

          <div className="grid gap-4 sm:gap-5">
            <div className="min-w-0">
              <label className="block">
                <span className="mb-2 block font-display text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cyan-100/72 sm:mb-3 sm:text-xs sm:tracking-[0.18em]">
                  Type Question Here
                </span>
                <textarea
                  ref={textAreaRef}
                  value={current.question_text}
                  onChange={(event) => setCurrent((state) => ({ ...state, question_text: event.target.value }))}
                  placeholder="Write your question, paste code, or add a formatted prompt..."
                  className="min-h-32 w-full resize-none rounded-[1.2rem] border border-white/12 bg-white/[0.055] px-4 py-4 font-sans text-base font-semibold leading-relaxed text-white outline-none shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-colors duration-200 placeholder:text-white/25 focus:border-cyan-100/40 sm:min-h-44 sm:rounded-[1.7rem] sm:px-5 sm:py-5 sm:text-lg"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                <NumberMiniCard
                  label="Time Per Question"
                  icon={<Clock3 className="size-4" />}
                  value={current.time_limit}
                  suffix="sec"
                  onChange={(value) => setCurrent((state) => ({ ...state, time_limit: value }))}
                />
                <NumberMiniCard
                  label="Points Per Question"
                  icon={<Trophy className="size-4" />}
                  value={current.points}
                  suffix="pts"
                  onChange={(value) => setCurrent((state) => ({ ...state, points: value }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
            {current.options.map((option, index) => {
              const selected = current.correctIndex === index;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 ${
                    selected
                      ? "border-emerald-100/46 bg-emerald-100/12 shadow-[0_0_30px_rgba(52,211,153,0.15)]"
                      : "border-white/10 bg-white/[0.045] hover:border-cyan-100/24"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrent((state) => ({ ...state, correctIndex: index }))}
                    className={`grid size-8 shrink-0 place-items-center rounded-lg border transition-colors sm:size-9 sm:rounded-xl ${
                      selected
                        ? "border-emerald-100/50 bg-emerald-100/16 text-emerald-50"
                        : "border-white/12 bg-white/[0.045] text-white/34"
                    }`}
                    aria-label={`Mark option ${index + 1} correct`}
                  >
                    <Check className="size-4" />
                  </button>
                  <input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 bg-transparent font-sans text-sm font-semibold text-white outline-none placeholder:text-white/28 sm:text-base"
                  />
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-2 z-20 mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/12 bg-slate-950/78 p-2 shadow-[0_14px_42px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:static sm:mt-5 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
            <button
              type="button"
              onClick={saveQuiz}
              disabled={!readyToSave || saving}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] transition-all duration-300 sm:h-14 sm:rounded-2xl sm:text-xs sm:tracking-[0.16em] ${
                readyToSave
                  ? "border-cyan-100/44 bg-cyan-100/14 text-cyan-50 shadow-[0_0_32px_rgba(103,232,249,0.22)]"
                  : "border-white/10 bg-white/[0.035] text-white/34"
              }`}
            >
              <Save className="size-4" />
              {saving ? "Saving" : "Save Quiz"}
            </button>
            <button
              type="button"
              onClick={saveNext}
              disabled={saveNextDisabled}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.055] px-3 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-white/72 transition-colors hover:border-fuchsia-100/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:rounded-2xl sm:text-xs sm:tracking-[0.16em]"
            >
              <ChevronRight className="size-4" />
              {atLimit ? "Limit" : "Save & Next"}
            </button>
          </div>

          <AnimatePresence>
            {statusMessage ? (
              <motion.p
                className={`mt-5 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${
                  isBackendError
                    ? "border-rose-100/24 bg-rose-100/[0.08] text-rose-50"
                    : "border-amber-100/20 bg-amber-100/[0.08] text-amber-50"
                }`}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
              >
                {isBackendError ? <AlertCircle className="size-4 shrink-0" /> : null}
                {statusMessage}
              </motion.p>
            ) : null}
          </AnimatePresence>

        </div>
      </div>
    </motion.section>
  );
}

function NumberMiniCard({
  label,
  value,
  suffix,
  icon,
  onChange
}: {
  label: string;
  value: string;
  suffix: string;
  icon: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
      <span className="mb-1.5 flex items-center gap-2 font-display text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white/44 sm:mb-2 sm:text-[0.68rem] sm:tracking-[0.16em]">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          value={value}
          type="number"
          min={suffix === "sec" ? 5 : 1}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-display text-lg font-extrabold text-white outline-none sm:text-xl"
        />
        <span className="text-xs font-bold uppercase text-white/38">{suffix}</span>
      </span>
    </label>
  );
}

function hasDraftContent(question: CurrentQuestionState) {
  return Boolean(question.question_text.trim() || question.options.some((option) => option.trim()));
}

function canConvertCurrent(question: CurrentQuestionState) {
  return (
    question.question_text.trim().length >= 4 &&
    question.options.every((option) => option.trim()) &&
    new Set(question.options.map((option) => option.trim().toLowerCase())).size === 4 &&
    question.correctIndex !== null &&
    Number(question.points) >= 1 &&
    Number(question.time_limit) >= 5
  );
}

function toQuestion(question: CurrentQuestionState, index: number): ManualQuizQuestion {
  const options = question.options.map((option) => option.trim());

  return {
    question_text: question.question_text.trim(),
    question_type: "mcq",
    options,
    correct_answers: [options[question.correctIndex ?? 0]],
    points: Math.max(1, Number(question.points)),
    time_limit: Math.max(5, Number(question.time_limit)),
    order_index: index
  };
}

function clampQuestionCount(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(100, Math.max(1, Math.floor(value)));
}
