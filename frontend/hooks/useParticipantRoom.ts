"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeSocket, emitWithAckTimeout, type RealtimeSocket } from "@/lib/realtimeSocket";
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

    let socket: RealtimeSocket;

    try {
      socket = createRealtimeSocket();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to connect to multiplayer server.");
      throw error;
    }

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
      setErrorMessage("Unable to connect to multiplayer server.");
    });

    socket.on("disconnect", () => {
      setErrorMessage("Realtime connection lost.");
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

      let socket: RealtimeSocket;

      try {
        socket = ensureSocket();
      } catch {
        return false;
      }

      setStatus("joining");
      setErrorMessage(null);

      if (!socket.connected) {
        socket.connect();
      }

      let ack: RoomAck;

      try {
        ack = await emitWithAckTimeout<RoomAck>(socket, "join_room", { room_code: normalizedCode });
      } catch {
        setStatus("error");
        setErrorMessage("Unable to connect to multiplayer server.");
        return false;
      }

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

    let ack: RoomAck;

    try {
      ack = await emitWithAckTimeout<RoomAck>(socket, "update_name", { name });
    } catch {
      setErrorMessage("Realtime connection lost.");
      return false;
    }

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
