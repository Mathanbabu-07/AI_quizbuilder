"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "genquiz_host_id";

function createHostId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `gq_${crypto.randomUUID()}`;
  }

  return `gq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function useDeviceHostId() {
  const [hostId, setHostId] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setHostId(existing);
      return;
    }

    const nextHostId = createHostId();
    window.localStorage.setItem(STORAGE_KEY, nextHostId);
    setHostId(nextHostId);
  }, []);

  return hostId;
}
