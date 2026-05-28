"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, FileText, Hash, Loader2, MessageSquareText, Sparkles, Timer, Trophy, UploadCloud, UserRound, UsersRound, X } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedInput } from "@/components/AnimatedInput";
import { AnimatedSelect } from "@/components/AnimatedSelect";
import { FloatingGlow } from "@/components/FloatingGlow";
import { uploadQuizFile, type UploadedQuizFile } from "@/lib/quizApi";
import type { Difficulty } from "@/types/quiz";

const questionOptions = Array.from({ length: 10 }, (_, index) => {
  const value = String(5 + index * 5);
  return { label: `${value} questions`, value };
});

const difficultyOptions = [
  { label: "Easy", value: "Easy", tone: "text-emerald-100" },
  { label: "Medium", value: "Medium", tone: "text-cyan-100" },
  { label: "Hard", value: "Hard", tone: "text-amber-100" },
  { label: "Very Hard", value: "Very Hard", tone: "text-rose-100" }
];

export type FileQuizSettings = {
  uploadedFileId: string;
  filename: string;
  mode: "solo" | "multiplayer";
  questionCount: number;
  difficulty: Difficulty;
  timePerQuestion: number;
  pointsPerQuestion: number;
  userPrompt: string;
};

type FileQuizPanelProps = {
  errorMessage?: string | null;
  generating: boolean;
  onGenerate: (settings: FileQuizSettings) => void;
  onBack: () => void;
};

function FileGenerationOverlay() {
  const steps = ["Scanning source", "Building MCQs", "Validating answers"];

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center rounded-[1.5rem] border border-cyan-100/16 bg-slate-950/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem]">
        <motion.span
          className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent"
          animate={{ y: [0, 260, 0], opacity: [0.16, 0.82, 0.16] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(240,171,252,0.06)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="relative mx-auto grid size-28 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full border border-cyan-100/22"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-4 rounded-full border border-fuchsia-100/18"
            animate={{ rotate: -360 }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="grid size-16 place-items-center rounded-2xl border border-cyan-100/24 bg-cyan-100/10 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.2)]"
            animate={{ y: [0, -5, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          >
            <FileText className="size-7" />
          </motion.span>
        </div>

        <p className="mt-5 font-display text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100/72">
          File AI Engine
        </p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
          Generating Quiz
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-white/54">
          Extracted content is being converted into validated questions.
        </p>

        <div className="mt-6 grid gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-left"
            >
              <motion.span
                className="grid size-7 place-items-center rounded-lg border border-cyan-100/18 bg-cyan-100/8 text-cyan-100"
                animate={{ opacity: [0.42, 1, 0.42], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
              >
                {index + 1}
              </motion.span>
              <span className="flex-1 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white/62">
                {step}
              </span>
              <Loader2 className="size-4 animate-spin text-cyan-100/70" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FileQuizPanelComponent({ errorMessage, generating, onGenerate, onBack }: FileQuizPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"solo" | "multiplayer">("solo");
  const [questions, setQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timePerQuestion, setTimePerQuestion] = useState("30");
  const [pointsPerQuestion, setPointsPerQuestion] = useState("1");
  const [userPrompt, setUserPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedQuizFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const statusText = useMemo(() => {
    if (generating) return "AI is building and validating the quiz...";
    if (uploading) return "Extracting readable content from your file...";
    if (uploadedFile) return `${uploadedFile.extracted_characters.toLocaleString()} characters extracted`;
    return "PDF and PPTX supported up to 10MB";
  }, [generating, uploadedFile, uploading]);

  const clearUploadedFile = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "pptx"].includes(extension ?? "")) {
      setUploadError("Upload a PDF or PPTX file.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedFile(null);
    try {
      const uploaded = await uploadQuizFile(file);
      setUploadedFile(uploaded);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const submit = () => {
    if (!uploadedFile || uploading || generating) return;
    onGenerate({
      uploadedFileId: uploadedFile.file_id,
      filename: uploadedFile.filename,
      mode,
      questionCount: Number(questions),
      difficulty,
      timePerQuestion: Number(timePerQuestion),
      pointsPerQuestion: Number(pointsPerQuestion),
      userPrompt: userPrompt.trim()
    });
  };

  return (
    <motion.section
      className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-20 sm:px-8 sm:py-24"
      initial={{ opacity: 0, y: 42, scale: 0.97, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
      transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-full max-w-6xl">
        <FloatingGlow className="-left-12 top-10 size-44 bg-cyan-300/14" />
        <FloatingGlow className="-right-16 bottom-24 size-52 bg-fuchsia-300/12" />
        <AnimatePresence>{generating ? <FileGenerationOverlay /> : null}</AnimatePresence>

        <button
          type="button"
          onClick={onBack}
          className="mb-5 h-10 rounded-xl border border-white/12 bg-white/[0.055] px-4 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white/62 backdrop-blur-xl transition-colors hover:border-cyan-100/28 hover:text-white"
        >
          Back
        </button>

        <div className="mb-6 text-center">
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100/76">
            File AI Generator
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
            Transform Files Into Quizzes
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/52">
            Upload a PDF or PPTX, extract the content, generate verified MCQs, then host solo or multiplayer.
          </p>
        </div>

        <div className="mb-5 flex justify-center">
          <div className="relative inline-grid grid-cols-2 rounded-2xl border border-white/12 bg-white/[0.055] p-1 shadow-[0_16px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            <motion.span
              className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-xl ${mode === "solo" ? "left-1 bg-cyan-100/14" : "left-[calc(50%+0rem)] bg-fuchsia-100/14"}`}
              layout
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
            />
            {[
              { value: "solo" as const, label: "Solo Mode", icon: UserRound },
              { value: "multiplayer" as const, label: "Multiplayer", icon: UsersRound }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={`relative z-10 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 font-display text-[0.68rem] font-extrabold uppercase tracking-[0.12em] transition-colors sm:px-5 ${
                    mode === item.value ? "text-white" : "text-white/44 hover:text-white/72"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            className={`group relative min-h-[20rem] overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-colors sm:p-7 ${
              dragging ? "border-cyan-100/48 bg-cyan-100/[0.085]" : "border-white/12 bg-white/[0.055]"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void handleFile(event.dataTransfer.files[0]);
            }}
            whileHover={{ y: -3 }}
          >
            <span className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
            <motion.span
              className="absolute inset-x-8 top-20 h-px bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent"
              animate={{ y: [0, 170, 0], opacity: [0.12, 0.72, 0.12] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="relative flex h-full min-h-[18rem] w-full flex-col items-center justify-center rounded-[1.25rem] border border-white/10 bg-slate-950/18 p-5 text-center outline-none transition-colors hover:border-cyan-100/24"
            >
              <motion.span
                className="grid size-20 place-items-center rounded-2xl border border-cyan-100/20 bg-cyan-100/10 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.18)]"
                animate={uploading || generating ? { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] } : { y: [0, -6, 0] }}
                transition={{ duration: uploading || generating ? 1.2 : 3.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {uploading ? <Loader2 className="size-9 animate-spin" /> : uploadedFile ? <CheckCircle2 className="size-9" /> : <UploadCloud className="size-9" />}
              </motion.span>
              <h3 className="mt-5 font-display text-xl font-extrabold uppercase text-white sm:text-2xl">
                Upload a File
              </h3>
              <p className="mt-2 text-sm font-semibold text-white/52">{statusText}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/35">PDF, PPTX</p>
            </button>
          </motion.div>

          <div className="grid gap-4">
            <AnimatePresence mode="wait">
              {uploadedFile ? (
                <motion.div
                  key="file"
                  className="relative rounded-2xl border border-emerald-100/16 bg-emerald-100/[0.055] p-4 pr-12 shadow-[0_16px_48px_rgba(0,0,0,0.2)] backdrop-blur-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button
                    type="button"
                    onClick={clearUploadedFile}
                    disabled={generating || uploading}
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-white/58 outline-none transition-colors hover:border-rose-100/34 hover:bg-rose-300/12 hover:text-rose-50 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Remove uploaded file"
                  >
                    <X className="size-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 size-5 shrink-0 text-emerald-100" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-extrabold text-white">{uploadedFile.filename}</p>
                      <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-white/50">{uploadedFile.preview}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {(uploadError || errorMessage) ? (
              <div className="rounded-2xl border border-rose-200/20 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-50">
                {uploadError || errorMessage}
              </div>
            ) : null}

            <AnimatedInput
              label="Quiz Instructions"
              value={userPrompt}
              onChange={setUserPrompt}
              placeholder="Example: focus on definitions, make exam-style questions, avoid dates..."
              icon={<MessageSquareText className="size-4" />}
              multiline
              helper={<span className="text-xs font-semibold text-white/42">Optional instructions help the AI shape the quiz from this file.</span>}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatedSelect label="Questions" value={questions} options={questionOptions} onChange={setQuestions} icon={Hash} />
              <AnimatedSelect label="Difficulty" value={difficulty} options={difficultyOptions} onChange={(value) => setDifficulty(value as Difficulty)} icon={Brain} />
              <AnimatedInput label="Time Per Question" value={timePerQuestion} onChange={setTimePerQuestion} icon={<Timer className="size-4" />} type="number" min={5} max={300} suffix="sec" />
              <AnimatedInput label="Points Per Question" value={pointsPerQuestion} onChange={setPointsPerQuestion} icon={<Trophy className="size-4" />} type="number" min={1} max={10} suffix="pts" />
            </div>

            <div className="pt-2 text-center">
              <AnimatedButton onClick={submit} disabled={!uploadedFile || uploading || generating}>
                <Sparkles className="mr-3 size-4" />
                {generating ? "Generating Quiz" : "Generate Quiz"}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export const FileQuizPanel = memo(FileQuizPanelComponent);
