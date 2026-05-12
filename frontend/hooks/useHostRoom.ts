"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeSocket, type RealtimeSocket } from "@/lib/realtimeSocket";
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

    const socket = createRealtimeSocket();
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
      setErrorMessage("Realtime host channel unavailable.");
    });

    socket.connect();

    socket.emitWithAck<RoomAck>("create_room", { room_code: roomCode }).then((ack) => {
      if (!ack.ok || !ack.room) {
        setStatus("error");
        setErrorMessage(ack.message ?? "Could not create multiplayer arena.");
        return;
      }

      setRoomState(ack.room);
      setStatus("active");
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

    const ack = await socket.emitWithAck<RoomAck>("start_room", { room_code: roomCode });
    if (!ack.ok) {
      setErrorMessage(ack.message ?? "Could not start multiplayer arena.");
    }
  }, [roomCode]);

  return {
    roomState,
    status,
    errorMessage,
    startRoom
  };
}
