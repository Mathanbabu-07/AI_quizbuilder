"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeSocket, type RealtimeSocket } from "@/lib/realtimeSocket";
import type { RoomAck, RoomState } from "@/types/multiplayer";

type ParticipantConnectionStatus = "idle" | "joining" | "waiting" | "started" | "error";

export function useParticipantRoom() {
  const socketRef = useRef<RealtimeSocket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<ParticipantConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ensureSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const socket = createRealtimeSocket();
    socketRef.current = socket;

    socket.on("room_updated", (room: RoomState) => {
      setRoomState(room);
      setStatus(room.status === "started" ? "started" : "waiting");
    });

    socket.on("quiz_started", (room: RoomState) => {
      setRoomState(room);
      setStatus("started");
    });

    socket.on("room_closed", (payload: { message?: string }) => {
      setStatus("error");
      setErrorMessage(payload.message ?? "The host closed this arena.");
    });

    socket.on("room_invalid", (payload: { message?: string }) => {
      setStatus("error");
      setErrorMessage(payload.message ?? "Invalid arena code.");
    });

    socket.on("connect_error", () => {
      setStatus("error");
      setErrorMessage("Realtime arena channel unavailable.");
    });

    return socket;
  }, []);

  const joinRoom = useCallback(
    async (roomCode: string) => {
      const normalizedCode = roomCode.trim().toUpperCase();
      if (normalizedCode.length < 4) {
        setErrorMessage("Enter a valid arena code.");
        return false;
      }

      const socket = ensureSocket();
      setStatus("joining");
      setErrorMessage(null);

      if (!socket.connected) {
        socket.connect();
      }

      const ack = await socket.emitWithAck<RoomAck>("join_room", { room_code: normalizedCode });
      if (!ack.ok || !ack.room || !ack.participant_id) {
        setStatus("error");
        setErrorMessage(ack.message ?? "Room not found.");
        return false;
      }

      setParticipantId(ack.participant_id);
      setRoomState(ack.room);
      setStatus(ack.room.status === "started" ? "started" : "waiting");
      return true;
    },
    [ensureSocket]
  );

  const updateName = useCallback(async (name: string) => {
    const socket = socketRef.current;
    if (!socket) {
      return false;
    }

    const ack = await socket.emitWithAck<RoomAck>("update_name", { name });
    if (!ack.ok) {
      setErrorMessage(ack.message ?? "Could not update name.");
      return false;
    }

    if (ack.room) {
      setRoomState(ack.room);
    }
    return true;
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("leave_room", {});
      socket.disconnect();
      socketRef.current = null;
    }
    setRoomState(null);
    setParticipantId(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    roomState,
    participantId,
    status,
    errorMessage,
    joinRoom,
    updateName,
    leaveRoom
  };
}
