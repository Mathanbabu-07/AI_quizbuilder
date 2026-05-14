"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Clock3, Save, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { SavedQuizzesPanel } from "@/components/SavedQuizzesPanel";
import type { ManualQuizDraft, ManualQuizQuestion, SavedManualQuizSummary } from "@/types/manualQuiz";

type ManualQuizBuilderProps = {
  initialDraft?: ManualQuizDraft | null;
  savedQuizzes: SavedManualQuizSummary[];
  loadingSaved: boolean;
  saving: boolean;
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
  onOpenSaved,
  onDeleteSaved,
  onSaveQuiz
}: ManualQuizBuilderProps) {
  const [quizId, setQuizId] = useState<string | undefined>(initialDraft?.id);
  const [title, setTitle] = useState(initialDraft?.title ?? "Untitled GENQUIZ Arena");
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
    setQuestions(initialDraft.questions);
    setCurrent(emptyQuestion);
    setWarning(null);
  }, [initialDraft]);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(340, Math.max(170, textarea.scrollHeight))}px`;
  }, [current.question_text]);

  const questionCount = questions.length + (hasDraftContent(current) ? 1 : 0);
  const readyToSave = questions.length > 0 || canConvertCurrent(current);

  const draft = useMemo<ManualQuizDraft>(() => {
    const finalized = canConvertCurrent(current) ? [...questions, toQuestion(current, questions.length)] : questions;
    return { id: quizId, title: title.trim() || "Untitled GENQUIZ Arena", questions: finalized };
  }, [current, questions, quizId, title]);

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

    if (hasDraftContent(current)) {
      const nextWarning = validateCurrent();
      if (nextWarning) {
        setWarning(nextWarning);
        return;
      }
      nextDraft = { id: quizId, title: title.trim() || "Untitled GENQUIZ Arena", questions: [...questions, toQuestion(current, questions.length)] };
    }

    if (nextDraft.questions.length === 0) {
      setWarning("Create at least one complete question before saving the quiz.");
      return;
    }

    setWarning(null);
    await onSaveQuiz(nextDraft);
  };

  return (
    <motion.section
      className="relative z-10 min-h-dvh px-4 py-24 sm:px-8"
      initial={{ opacity: 0, y: 34, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto grid w-full max-w-[92rem] gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <SavedQuizzesPanel
          quizzes={savedQuizzes}
          loading={loadingSaved}
          onOpen={onOpenSaved}
          onDelete={onDeleteSaved}
        />

        <div className="rounded-[2rem] border border-white/12 bg-slate-950/28 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100/72">
                Quiz Title
              </span>
              <span className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.055] px-4 py-3">
                <Save className="size-4 shrink-0 text-cyan-100/68" />
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-display text-xl font-extrabold text-white outline-none placeholder:text-white/26 sm:text-2xl"
                  placeholder="Quiz title"
                />
              </span>
            </label>

            <div className="rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3 text-center">
              <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-white/46">
                Question Count
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold text-white">
                Question {Math.max(1, questions.length + 1)} / {Math.max(1, questionCount)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="order-2 flex flex-col gap-3 xl:order-1">
              <button
                type="button"
                onClick={saveQuiz}
                disabled={!readyToSave || saving}
                className={`rounded-2xl border px-4 py-4 font-display text-xs font-extrabold uppercase tracking-[0.16em] transition-all duration-300 ${
                  readyToSave
                    ? "border-cyan-100/34 bg-cyan-100/12 text-cyan-50 shadow-[0_0_34px_rgba(103,232,249,0.18)]"
                    : "border-white/10 bg-white/[0.035] text-white/34"
                }`}
              >
                <Save className="mx-auto mb-2 size-5" />
                {saving ? "Saving..." : "Save Quiz"}
              </button>
              <button
                type="button"
                onClick={saveNext}
                className="rounded-2xl border border-white/12 bg-white/[0.055] px-4 py-4 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white/72 transition-colors hover:border-fuchsia-100/30 hover:text-white"
              >
                <ChevronRight className="mx-auto mb-2 size-5" />
                Save & Next
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs font-semibold leading-relaxed text-white/42">
                <Sparkles className="mb-2 size-4 text-cyan-100/62" />
                Select the glowing check on one option to mark the correct answer.
              </div>
            </div>

            <div className="order-1 min-w-0 xl:order-2">
              <label className="block">
                <span className="mb-3 block font-display text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100/72">
                  Type Question Here
                </span>
                <textarea
                  ref={textAreaRef}
                  value={current.question_text}
                  onChange={(event) => setCurrent((state) => ({ ...state, question_text: event.target.value }))}
                  placeholder="Write your question, paste code, or add a formatted prompt..."
                  className="min-h-44 w-full resize-none rounded-[1.7rem] border border-white/12 bg-white/[0.055] px-5 py-5 font-sans text-lg font-semibold leading-relaxed text-white outline-none shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-colors duration-200 placeholder:text-white/25 focus:border-cyan-100/40"
                />
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {current.options.map((option, index) => {
              const selected = current.correctIndex === index;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                    selected
                      ? "border-emerald-100/46 bg-emerald-100/12 shadow-[0_0_30px_rgba(52,211,153,0.15)]"
                      : "border-white/10 bg-white/[0.045] hover:border-cyan-100/24"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrent((state) => ({ ...state, correctIndex: index }))}
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border transition-colors ${
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

          <AnimatePresence>
            {warning ? (
              <motion.p
                className="mt-5 rounded-2xl border border-amber-100/20 bg-amber-100/[0.08] px-4 py-3 text-center text-sm font-semibold text-amber-50"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
              >
                {warning}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <div className="mt-7 flex justify-center">
            <AnimatedButton onClick={saveQuiz} disabled={!readyToSave || saving}>
              <Save className="mr-3 size-4" />
              {saving ? "Saving Quiz" : "Save Quiz"}
            </AnimatedButton>
          </div>
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
    <label className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <span className="mb-2 flex items-center gap-2 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white/44">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          value={value}
          type="number"
          min={suffix === "sec" ? 5 : 1}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-display text-xl font-extrabold text-white outline-none"
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
