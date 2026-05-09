"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AmbientGlowLayer() {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-[-12%] top-[8%] h-[42rem] w-[18rem] rotate-[24deg] bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.08),rgba(255,255,255,0.045),transparent)] blur-2xl"
        animate={motionEnabled ? { x: ["-8%", "18%", "-8%"], opacity: [0.25, 0.58, 0.25] } : false}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-16%] top-[4%] h-[46rem] w-[22rem] -rotate-[28deg] bg-[linear-gradient(90deg,transparent,rgba(240,171,252,0.07),rgba(125,211,252,0.045),transparent)] blur-2xl"
        animate={motionEnabled ? { x: ["8%", "-18%", "8%"], opacity: [0.2, 0.5, 0.2] } : false}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_18%_72%,rgba(45,212,191,0.1),transparent_28%),radial-gradient(circle_at_86%_74%,rgba(217,70,239,0.09),transparent_30%)] opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18%,transparent_72%,rgba(103,232,249,0.035))]" />
    </div>
  );
}
