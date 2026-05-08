"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, CircleDot, Sparkle, Trophy } from "lucide-react";
import { usePointerParallax } from "@/hooks/usePointerParallax";

const particles = [
  { x: "8%", y: "18%", size: 3, delay: 0.1, duration: 8.5 },
  { x: "16%", y: "72%", size: 2, delay: 1.2, duration: 9.2 },
  { x: "24%", y: "34%", size: 4, delay: 0.6, duration: 10.4 },
  { x: "32%", y: "82%", size: 2, delay: 1.8, duration: 8.8 },
  { x: "43%", y: "22%", size: 3, delay: 0.3, duration: 9.7 },
  { x: "52%", y: "64%", size: 2, delay: 2.1, duration: 8.9 },
  { x: "61%", y: "12%", size: 4, delay: 1.1, duration: 10.1 },
  { x: "68%", y: "78%", size: 3, delay: 0.9, duration: 9.6 },
  { x: "77%", y: "29%", size: 2, delay: 1.6, duration: 8.6 },
  { x: "86%", y: "58%", size: 4, delay: 0.4, duration: 10.6 },
  { x: "91%", y: "16%", size: 2, delay: 2.4, duration: 9.4 },
  { x: "12%", y: "47%", size: 2, delay: 2.0, duration: 11.1 },
  { x: "38%", y: "52%", size: 3, delay: 1.4, duration: 9.1 },
  { x: "73%", y: "48%", size: 2, delay: 0.7, duration: 10.8 },
  { x: "6%", y: "58%", size: 3, delay: 1.7, duration: 12.3 },
  { x: "18%", y: "12%", size: 2, delay: 0.5, duration: 9.5 },
  { x: "27%", y: "60%", size: 2, delay: 1.1, duration: 11.4 },
  { x: "35%", y: "16%", size: 3, delay: 2.2, duration: 10.2 },
  { x: "41%", y: "74%", size: 4, delay: 0.2, duration: 12.1 },
  { x: "49%", y: "38%", size: 2, delay: 1.5, duration: 9.9 },
  { x: "57%", y: "84%", size: 3, delay: 1.9, duration: 11.7 },
  { x: "66%", y: "20%", size: 2, delay: 0.8, duration: 10.1 },
  { x: "71%", y: "67%", size: 3, delay: 2.3, duration: 12.8 },
  { x: "82%", y: "40%", size: 2, delay: 1.0, duration: 10.7 },
  { x: "94%", y: "70%", size: 3, delay: 1.6, duration: 11.9 }
];

const glowParticles = [
  { x: "11%", y: "27%", size: 10, delay: 0.4, duration: 14.5, color: "bg-cyan-200/24" },
  { x: "22%", y: "82%", size: 12, delay: 1.4, duration: 15.8, color: "bg-sky-200/20" },
  { x: "36%", y: "41%", size: 14, delay: 0.9, duration: 13.4, color: "bg-cyan-100/18" },
  { x: "47%", y: "19%", size: 9, delay: 1.8, duration: 16.1, color: "bg-emerald-200/18" },
  { x: "58%", y: "56%", size: 11, delay: 0.7, duration: 14.2, color: "bg-sky-200/16" },
  { x: "69%", y: "31%", size: 13, delay: 1.2, duration: 15.4, color: "bg-fuchsia-200/14" },
  { x: "81%", y: "76%", size: 10, delay: 0.3, duration: 13.9, color: "bg-amber-200/14" },
  { x: "89%", y: "14%", size: 12, delay: 2.0, duration: 16.3, color: "bg-cyan-200/18" }
];

const arenaGlyphs = [
  { Icon: BrainCircuit, x: "14%", y: "28%", color: "text-cyan-200/24", delay: 0 },
  { Icon: Trophy, x: "80%", y: "74%", color: "text-amber-200/22", delay: 1.4 },
  { Icon: Sparkle, x: "78%", y: "22%", color: "text-fuchsia-200/24", delay: 0.8 },
  { Icon: CircleDot, x: "20%", y: "76%", color: "text-emerald-200/20", delay: 2.1 }
];

export function AnimatedBackground() {
  const parallax = usePointerParallax(28);
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  return (
    <div className="pointer-events-none absolute inset-0 isolate overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(20,184,166,0.16),transparent_31%),linear-gradient(130deg,#050611_0%,#0a1022_42%,#120817_100%)]" />

      <motion.div
        className="absolute -left-[16rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-300/24 blur-[92px]"
        animate={motionEnabled ? { x: parallax.x * 0.55, y: parallax.y * 0.4, scale: [1, 1.08, 1] } : false}
        transition={{ scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div
        className="absolute -right-[15rem] bottom-[-16rem] h-[36rem] w-[36rem] rounded-full bg-fuchsia-400/20 blur-[100px]"
        animate={motionEnabled ? { x: parallax.x * -0.45, y: parallax.y * -0.35, scale: [1, 1.1, 1] } : false}
        transition={{ scale: { duration: 9, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div
        className="absolute left-[42%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-emerald-300/12 blur-[76px]"
        animate={motionEnabled ? { x: parallax.x * -0.28, y: parallax.y * 0.32, opacity: [0.55, 0.85, 0.55] } : false}
        transition={{ opacity: { duration: 7.5, repeat: Infinity, ease: "easeInOut" } }}
      />

      <motion.div
        className="absolute inset-x-[-12%] bottom-[-18%] h-[58%] origin-bottom bg-[linear-gradient(rgba(34,211,238,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.14)_1px,transparent_1px)] bg-[size:64px_64px] opacity-35 [mask-image:linear-gradient(to_top,black,transparent_78%)]"
        style={{ transform: "perspective(820px) rotateX(62deg)" }}
        animate={motionEnabled ? { backgroundPosition: ["0px 0px", "64px 64px"] } : false}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(34,211,238,0.08)_49%,rgba(255,255,255,0.16)_50%,rgba(34,211,238,0.08)_51%,transparent_100%)] opacity-0 mix-blend-screen"
        animate={motionEnabled ? { x: ["-120%", "120%"], opacity: [0, 0.25, 0] } : false}
        transition={{ duration: 7.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        animate={motionEnabled ? { x: parallax.x * 0.22, y: parallax.y * 0.22 } : false}
        transition={{ type: "spring", stiffness: 90, damping: 28 }}
      >
        {particles.map((particle) => (
          <motion.span
            key={`${particle.x}-${particle.y}`}
            className="absolute rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.85)]"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size
            }}
            animate={
              motionEnabled
                ? {
                    y: [0, -24, 0],
                    opacity: [0.16, 0.86, 0.16],
                    scale: [1, 1.55, 1]
                  }
                : false
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={motionEnabled ? { x: parallax.x * 0.14, y: parallax.y * 0.16 } : false}
        transition={{ type: "spring", stiffness: 70, damping: 26 }}
      >
        {glowParticles.map((particle) => (
          <motion.span
            key={`${particle.x}-${particle.y}-glow`}
            className={`absolute rounded-full blur-xl ${particle.color}`}
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size
            }}
            animate={
              motionEnabled
                ? {
                    y: [0, -18, 0],
                    x: [0, 6, 0],
                    opacity: [0.2, 0.52, 0.2],
                    scale: [1, 1.35, 1]
                  }
                : false
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {arenaGlyphs.map(({ Icon, x, y, color, delay }) => (
        <motion.div
          key={`${x}-${y}`}
          className={`absolute ${color}`}
          style={{ left: x, top: y }}
          animate={
            motionEnabled
              ? {
                  y: [0, -12, 0],
                  rotate: [-3, 3, -3],
                  opacity: [0.28, 0.55, 0.28]
                }
              : false
          }
          transition={{ duration: 7.8, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="size-9 drop-shadow-[0_0_22px_currentColor] sm:size-11" strokeWidth={1.35} />
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_44%,rgba(3,5,12,0.72)_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:100%_4px]" />
    </div>
  );
}
