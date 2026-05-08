"use client";

import { useEffect, useState } from "react";

type PointerParallax = {
  x: number;
  y: number;
};

export function usePointerParallax(strength = 1): PointerParallax {
  const [position, setPosition] = useState<PointerParallax>({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * strength;
        const y = (event.clientY / window.innerHeight - 0.5) * strength;

        setPosition({ x, y });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [strength]);

  return position;
}
