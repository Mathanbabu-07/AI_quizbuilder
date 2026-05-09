"use client";

import { motion, useReducedMotion } from "framer-motion";

export function FloatingTitle() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.h1
      className="relative z-10 inline-block transform-gpu bg-[linear-gradient(95deg,#ffffff_0%,#67e8f9_18%,#f0abfc_38%,#ffffff_58%,#7dd3fc_78%,#ffffff_100%)] bg-[length:320%_100%] bg-clip-text font-display text-[2.85rem] font-extrabold leading-[0.9] tracking-[0.045em] text-transparent drop-shadow-[0_0_20px_rgba(103,232,249,0.2)] sm:text-7xl sm:tracking-[0.09em] md:text-8xl lg:text-[8.15rem]"
      animate={
        reduceMotion
          ? false
          : {
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }
      }
      transition={{
        backgroundPosition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      GENQUIZ
    </motion.h1>
  );
}
