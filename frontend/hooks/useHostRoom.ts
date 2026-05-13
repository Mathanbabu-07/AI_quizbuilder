"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeSocket, emitWithAckTimeout, type RealtimeSocket } from "@/lib/realtimeSocket";
import type { RoomAck, RoomState } from "@/types/multiplayer";

type HostRoomStatus = "idle" | "connecting" | "active" | "error";

export function useHostRoom(enabled: boolean, roomCode: string | null) {
  const socketRef = useRef<RealtimeSocket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<HostRoomStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !roomCode) {
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

    emitWithAckTimeout<RoomAck>(socket, "create_room", { room_code: roomCode })
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
  }, [enabled, roomCode]);

  const startRoom = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket || !roomCode) {
      return;
    }

    try {
      const ack = await emitWithAckTimeout<RoomAck>(socket, "start_room", { room_code: roomCode });
      if (!ack.ok) {
        setErrorMessage(ack.message ?? "Could not start multiplayer arena.");
      }
    } catch {
      setErrorMessage("Realtime connection lost.");
    }
  }, [roomCode]);

  return {
    roomState,
    status,
    errorMessage,
    startRoom
  };
}
