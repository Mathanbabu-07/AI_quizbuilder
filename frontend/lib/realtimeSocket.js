"use client";

import { io } from "socket.io-client";

export const REALTIME_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function createRealtimeSocket() {
  return io(REALTIME_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 650,
    timeout: 8000
  });
}
