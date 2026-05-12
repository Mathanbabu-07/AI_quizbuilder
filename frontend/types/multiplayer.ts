export type ParticipantRole = "host" | "participant";
export type RoomStatus = "waiting" | "started" | "closed";

export type ParticipantState = {
  id: string;
  name: string;
  role: ParticipantRole;
  is_host: boolean;
  joined_at: number;
};

export type RoomState = {
  code: string;
  status: RoomStatus;
  host_id: string;
  participants: ParticipantState[];
  participant_count: number;
  created_at: number;
};

export type RoomAck = {
  ok: boolean;
  message?: string;
  participant_id?: string;
  room?: RoomState;
};
