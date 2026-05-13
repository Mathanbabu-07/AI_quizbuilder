export type ParticipantRole = "host" | "participant";
export type RoomStatus = "waiting" | "started" | "finished" | "closed";

export type ParticipantState = {
  id: string;
  name: string;
  role: ParticipantRole;
  is_host: boolean;
  joined_at: number;
  completed: boolean;
  score: number | null;
  accuracy: number | null;
  average_response_time: number | null;
};

export type RoomState = {
  code: string;
  status: RoomStatus;
  host_id: string;
  participants: ParticipantState[];
  participant_count: number;
  created_at: number;
  started_at: number | null;
  quiz: import("@/types/quiz").GeneratedQuiz | null;
  settings: import("@/types/quiz").QuizSettings | null;
  leaderboard: ParticipantState[];
  all_finished: boolean;
};

export type RoomAck = {
  ok: boolean;
  message?: string;
  participant_id?: string;
  room?: RoomState;
};
