export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";

export type QuizQuestion = {
  question: string;
  choices: string[];
  correct_answer: string;
  difficulty: Difficulty;
  time_limit?: number;
  points?: number;
};

export type GeneratedQuiz = {
  title: string;
  questions: QuizQuestion[];
};

export type QuizSettings = {
  prompt: string;
  questionCount: number;
  difficulty: Difficulty;
  timePerQuestion: number;
  totalQuizTime: number;
  pointsPerQuestion?: number;
  source?: "text" | "file" | "url" | "manual";
};

export type QuizAnswer = {
  questionIndex: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number;
};

export type QuizResult = {
  quiz: GeneratedQuiz;
  answers: QuizAnswer[];
  settings: QuizSettings;
};
