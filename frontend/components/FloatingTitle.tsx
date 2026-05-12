"use client";

import { motion, useReducedMotion } from "framer-motion";

export function FloatingTitle() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.h1
      className="relative z-10 inline-block transform-gpu select-none font-display text-[2.85rem] font-extrabold leading-[0.9] tracking-[0.045em] text-white drop-shadow-[0_0_20px_rgba(103,232,249,0.2)] sm:text-7xl sm:tracking-[0.09em] md:text-8xl lg:text-[8.15rem]"
      animate={
        reduceMotion
          ? false
          : {
              color: ["#ffffff", "#67e8f9", "#f0abfc", "#ffffff", "#7dd3fc", "#ffffff"],
              textShadow: [
                "0 0 14px rgba(103,232,249,0.16)",
                "0 0 30px rgba(103,232,249,0.28)",
                "0 0 28px rgba(240,171,252,0.22)",
                "0 0 18px rgba(255,255,255,0.18)",
                "0 0 30px rgba(125,211,252,0.22)",
                "0 0 14px rgba(103,232,249,0.16)"
              ]
            }
      }
      transition={{
        color: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
        textShadow: { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      GENQUIZ
    </motion.h1>
  );
}
