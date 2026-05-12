"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedLogo() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative z-0 mb-3 size-24 select-none overflow-hidden rounded-full border border-cyan-100/22 bg-white/[0.06] shadow-[0_0_34px_rgba(103,232,249,0.32),0_0_90px_rgba(14,165,233,0.14)] backdrop-blur-md sm:mb-[-2.35rem] sm:size-40 md:mb-[-2.9rem] md:size-52"
      animate={reduceMotion ? false : { opacity: [0.88, 1, 0.88] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(103,232,249,0.48),rgba(240,171,252,0.28),rgba(45,212,191,0.35),transparent)] opacity-75 blur-sm"
        animate={reduceMotion ? false : { opacity: [0.48, 0.9, 0.48] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <img
        src="/genquiz-logo.jpeg"
        alt=""
        className="relative h-full w-full scale-110 object-cover brightness-125 contrast-110 saturate-125 mix-blend-screen"
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_40%_25%,rgba(255,255,255,0.34),transparent_28%),radial-gradient(circle,transparent_42%,rgba(5,6,17,0.62)_100%)]"
        animate={reduceMotion ? false : { opacity: [0.62, 0.96, 0.62] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
