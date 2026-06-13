"use client";

import { useEffect, useState } from "react";

export function useFinePointer() {
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return finePointer;
}
