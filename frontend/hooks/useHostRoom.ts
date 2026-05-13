"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeSocket, emitWithAckTimeout, type RealtimeSocket } from "@/lib/realtimeSocket";
import type { RoomAck, RoomState } from "@/types/multiplayer";
import type { GeneratedQuiz, QuizResult, QuizSettings } from "@/types/quiz";

type HostRoomStatus = "idle" | "connecting" | "active" | "error";

export type HostRoomController = ReturnType<typeof useHostRoom>;

function getResultMetrics(result: QuizResult) {
  const correct = result.answers.filter((answer) => answer.isCorrect).length;
  const total = result.quiz.questions.length;
  const averageResponseTime =
    result.answers.length > 0
      ? Math.round(result.answers.reduce((sum, answer) => sum + answer.responseTime, 0) / result.answers.length)
      : 0;

  return {
    score: correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    average_response_time: averageResponseTime
  };
}

export function useHostRoom(
  enabled: boolean,
  roomCode: string | null,
  quiz: GeneratedQuiz | null = null,
  settings: QuizSettings | null = null
) {
  const socketRef = useRef<RealtimeSocket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<HostRoomStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !roomCode || !quiz || !settings) {
      const socket = socketRef.current;
      if (socket) {
        socket.emit("close_room", { room_code: roomCode });
        socket.disconnect();
        socketRef.current = null;
      }
      setRoomState(null);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    let socket: RealtimeSocket;

    try {
      socket = createRealtimeSocket();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to connect to multiplayer server.");
      return;
    }

    socketRef.current = socket;
    setStatus("connecting");

    socket.on("room_updated", (room: RoomState) => {
      if (room.code === roomCode) {
        setRoomState(room);
        setStatus("active");
      }
    });

    socket.on("room_closed", () => {
      setRoomState(null);
      setStatus("idle");
    });

    socket.on("connect_error", () => {
      setStatus("error");
      setErrorMessage("Unable to connect to multiplayer server.");
    });

    socket.on("disconnect", () => {
      setErrorMessage("Realtime connection lost.");
    });

    socket.connect();

    emitWithAckTimeout<RoomAck>(socket, "create_room", { room_code: roomCode, quiz, settings })
      .then((ack) => {
        if (!ack.ok || !ack.room) {
          setStatus("error");
          setErrorMessage(ack.message ?? "Could not create multiplayer arena.");
          return;
        }

        setRoomState(ack.room);
        setStatus("active");
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Unable to connect to multiplayer server.");
      });

    return () => {
      socket.emit("close_room", { room_code: roomCode });
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [enabled, roomCode, quiz, settings]);

  const startRoom = useCallback(async (quiz: GeneratedQuiz, settings: QuizSettings) => {
    const socket = socketRef.current;
    if (!socket || !roomCode) {
      return false;
    }

    try {
      const ack = await emitWithAckTimeout<RoomAck>(socket, "start_room", {
        room_code: roomCode,
        quiz,
        settings
      });
      if (!ack.ok) {
        setErrorMessage(ack.message ?? "Could not start multiplayer arena.");
        return false;
      }
      if (ack.room) {
        setRoomState(ack.room);
      }
      return true;
    } catch {
      setErrorMessage("Realtime connection lost.");
      return false;
    }
  }, [roomCode]);

  const submitResult = useCallback(async (result: QuizResult) => {
    const socket = socketRef.current;
    if (!socket) {
      return null;
    }

    try {
      const ack = await emitWithAckTimeout<RoomAck>(socket, "submit_result", getResultMetrics(result));
      if (!ack.ok) {
        setErrorMessage(ack.message ?? "Could not sync multiplayer results.");
        return null;
      }
      if (ack.room) {
        setRoomState(ack.room);
      }
      return ack.room ?? null;
    } catch {
      setErrorMessage("Realtime connection lost.");
      return null;
    }
  }, []);

  return {
    roomState,
    status,
    errorMessage,
    startRoom,
    submitResult
  };
}
