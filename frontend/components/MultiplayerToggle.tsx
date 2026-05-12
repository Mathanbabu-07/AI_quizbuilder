"use client";

import { motion } from "framer-motion";
import { Gamepad2, Users, Wifi } from "lucide-react";
import { AnimatedToggleSwitch } from "@/components/AnimatedToggleSwitch";

type MultiplayerToggleProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function MultiplayerToggle({ enabled, onToggle }: MultiplayerToggleProps) {
  return (
    <motion.div
      className={`relative isolate overflow-hidden rounded-3xl border p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-colors duration-300 sm:p-5 ${
        enabled
          ? "border-cyan-100/26 bg-cyan-200/[0.085]"
          : "border-white/12 bg-white/[0.055]"
      }`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <motion.span
        className="absolute right-0 top-0 -z-10 size-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-cyan-300/16 blur-3xl"
        animate={enabled ? { opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.15, 0.92] } : { opacity: 0.18, scale: 0.9 }}
        transition={{ duration: 3.8, repeat: enabled ? Infinity : 0, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300 ${
                enabled
                  ? "border-cyan-100/30 bg-cyan-200/14 text-cyan-50"
                  : "border-white/12 bg-white/[0.055] text-white/54"
              }`}
            >
              <Users className="size-4" />
            </span>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.12em] text-white">
              Multiplayer Mode
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-white/42">
            <span className="inline-flex items-center gap-1.5">
              <Wifi className="size-3.5 text-cyan-100/58" />
              {enabled ? "Live host code active" : "Solo review"}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-white/26 sm:block" />
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Gamepad2 className="size-3.5 text-fuchsia-100/48" />
              Arena ready
            </span>
          </div>
        </div>

        <AnimatedToggleSwitch checked={enabled} onToggle={onToggle} label="Toggle multiplayer mode" />
      </div>
    </motion.div>
  );
}
