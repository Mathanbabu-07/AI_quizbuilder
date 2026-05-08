import type { Transition, Variants } from "framer-motion";

export const heroContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.18,
      staggerChildren: 0.12
    }
  }
};

export const heroItem: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const floatLoop = {
  y: [0, -8, 0],
  transition: {
    duration: 5.5,
    repeat: Infinity,
    ease: "easeInOut"
  } satisfies Transition
};
