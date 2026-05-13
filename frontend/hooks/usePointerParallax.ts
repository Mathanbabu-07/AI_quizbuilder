"use client";

import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { useEffect } from "react";

type PointerParallax = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

export function usePointerParallax(strength = 1): PointerParallax {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 70, damping: 28, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 70, damping: 28, mass: 0.5 });

  useEffect(() => {
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * strength;
        const y = (event.clientY / window.innerHeight - 0.5) * strength;

        rawX.set(x);
        rawY.set(y);
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [rawX, rawY, strength]);

  return { x, y };
}
