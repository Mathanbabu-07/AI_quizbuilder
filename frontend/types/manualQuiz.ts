import type { GeneratedQuiz, QuizSettings } from "@/types/quiz";

export type ManualQuestionType = "mcq" | "multiselect" | "true_false" | "fill_blank" | "passage";
export type ManualQuizStatus = "draft" | "ready" | "archived";

export type ManualQuizQuestion = {
  question_text: string;
  question_type: ManualQuestionType;
  options: string[];
  correct_answers: string[];
  points: number;
  time_limit: number;
  order_index: number;
};

export type ManualQuizSavePayload = {
  host_id: string;
  title: string;
  questionType: ManualQuestionType;
  multiplayer: boolean;
  roomCode?: string | null;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    timePerQuestion: number;
    points: number;
  }>;
};

export type SavedManualQuizSummary = {
  id: string;
  title: string;
  host_id: string;
  question_count: number;
  mode: string;
  status: ManualQuizStatus;
  question_type?: ManualQuestionType;
  multiplayer?: boolean;
  room_code?: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_edited?: string | null;
};

export type SavedManualQuiz = SavedManualQuizSummary & {
  questions: ManualQuizQuestion[];
};

export type ManualQuizDraft = {
  id?: string;
  title: string;
  targetQuestionCount?: number;
  questions: ManualQuizQuestion[];
};

export function manualQuizToGeneratedQuiz(quiz: ManualQuizDraft): GeneratedQuiz {
  return {
    title: quiz.title,
    questions: quiz.questions.map((question) => ({
      question: question.question_text,
      choices: question.options,
      correct_answer: question.correct_answers[0] ?? question.options[0] ?? "",
      difficulty: "Medium"
    }))
  };
}

export function manualQuizToSettings(quiz: ManualQuizDraft): QuizSettings {
  const firstQuestion = quiz.questions[0];
  const totalSeconds = quiz.questions.reduce((sum, question) => sum + question.time_limit, 0);

  return {
    prompt: quiz.title,
    questionCount: Math.max(1, quiz.questions.length),
    difficulty: "Medium",
    timePerQuestion: firstQuestion?.time_limit ?? 30,
    totalQuizTime: Math.max(1, Math.ceil(totalSeconds / 60))
  };
}
