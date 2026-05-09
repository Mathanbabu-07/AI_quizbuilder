"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Gamepad2, Sparkles, Trophy, Wand2, Zap } from "lucide-react";
import type { RefObject } from "react";

type AboutGQSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

const features = [
  {
    icon: BrainCircuit,
    title: "AI Quiz Engine",
    body: "Generate structured quizzes from any topic with difficulty-aware questions, choices, and answer validation."
  },
  {
    icon: Gamepad2,
    title: "Arena Gameplay",
    body: "Run one-question-at-a-time sessions with timers, instant feedback, and satisfying correct or wrong states."
  },
  {
    icon: Trophy,
    title: "Performance Results",
    body: "Finish with score analytics, response timing, and a knowledge profile built around the quiz topic."
  }
];

const options = [
  "Custom question counts",
  "Difficulty control",
  "Per-question timing",
  "Total quiz timer",
  "Code snippet display",
  "Host review mode"
];

export function AboutGQSection({ sectionRef }: AboutGQSectionProps) {
  return (
    <section ref={sectionRef} className="relative z-10 px-4 pb-24 pt-10 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/16 bg-white/[0.055] px-4 py-2 font-display text-[0.68rem] font-extrabold uppercase text-cyan-100/76 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl">
            <Sparkles className="size-3.5" />
            About GQ
          </div>
          <h2 className="mx-auto max-w-4xl bg-[linear-gradient(95deg,#fff,#67e8f9,#f0abfc,#fff)] bg-[length:260%_100%] bg-clip-text font-display text-3xl font-extrabold leading-tight text-transparent motion-safe:animate-[shine_5s_linear_infinite] sm:text-5xl">
            A premium AI playground for building quiz arenas.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-base font-medium leading-8 text-white/62 sm:text-lg">
            GENQUIZ combines AI generation, multiplayer-ready architecture, game-like pacing, and cinematic UI motion into one fast quiz creation flow.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 shadow-[0_18px_58px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6"
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ delay: index * 0.08, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 grid size-11 place-items-center rounded-2xl border border-cyan-100/16 bg-cyan-100/8 text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,0.12)]">
                <feature.icon className="size-5" strokeWidth={1.9} />
              </div>
              <h3 className="font-display text-xl font-extrabold text-white">{feature.title}</h3>
              <p className="mt-3 font-sans text-sm font-medium leading-7 text-white/58">{feature.body}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="mt-5 grid gap-4 rounded-3xl border border-white/12 bg-white/[0.045] p-5 shadow-[0_18px_64px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:grid-cols-[0.9fr_1.1fr] sm:p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 font-display text-xs font-extrabold uppercase text-fuchsia-100/72">
              <Zap className="size-4" />
              Gameplay options
            </div>
            <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Built for fast setup and replay.</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 font-sans text-sm font-bold text-white/68"
              >
                <Wand2 className="size-4 shrink-0 text-cyan-100/72" />
                {option}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
