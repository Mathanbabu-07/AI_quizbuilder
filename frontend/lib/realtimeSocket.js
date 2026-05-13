"use client";

import { io } from "socket.io-client";

export const REALTIME_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim().replace(/\/$/, "") ?? "";

export function createRealtimeSocket() {
  if (!REALTIME_URL) {
    throw new Error("GENQUIZ realtime server is not configured. Set NEXT_PUBLIC_SOCKET_URL.");
  }

  return io(REALTIME_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 650,
    reconnectionDelayMax: 4000,
    timeout: 8000
  });
}

export function emitWithAckTimeout(socket, event, payload, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    socket.timeout(timeoutMs).emit(event, payload, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}
