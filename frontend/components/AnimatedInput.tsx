"use client";

import { motion } from "framer-motion";
import type { ChangeEvent, ReactNode } from "react";

type AnimatedInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  placeholder?: string;
  suffix?: string;
  type?: "text" | "number";
  multiline?: boolean;
  min?: number;
  max?: number;
  action?: ReactNode;
  helper?: ReactNode;
};

export function AnimatedInput({
  label,
  value,
  onChange,
  icon,
  placeholder,
  suffix,
  type = "text",
  multiline = false,
  min,
  max,
  action,
  helper
}: AnimatedInputProps) {
  const sharedClass =
    "peer w-full border-0 bg-transparent font-sans text-base font-semibold text-white outline-none placeholder:text-white/28";

  return (
    <motion.label
      className="group relative isolate block overflow-hidden rounded-2xl border border-white/12 bg-white/[0.065] p-[1px] shadow-[0_18px_52px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent,rgba(103,232,249,0.26),transparent,rgba(240,171,252,0.18),transparent)] bg-[length:260%_100%] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 motion-safe:group-focus-within:animate-[shine_4.5s_linear_infinite]" />
      <span className="absolute inset-[1px] -z-10 rounded-[15px] bg-slate-950/48" />

      <span className="flex min-h-24 items-start gap-4 rounded-[15px] px-5 py-4 sm:px-6 sm:py-5">
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl border border-cyan-100/15 bg-cyan-100/8 text-cyan-100 shadow-[0_0_20px_rgba(103,232,249,0.12)] transition-colors duration-300 group-focus-within:border-cyan-100/35 group-focus-within:bg-cyan-100/14">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-2 flex items-start justify-between gap-3">
            <span className="block font-display text-[0.68rem] font-bold uppercase text-white/42 transition-colors duration-300 group-focus-within:text-cyan-100/80">
              {label}
            </span>
            {action ? <span className="shrink-0">{action}</span> : null}
          </span>
          <span className="flex items-center gap-3">
            {multiline ? (
              <textarea
                className={`${sharedClass} min-h-20 resize-none leading-7`}
                value={value}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={3}
              />
            ) : (
              <input
                className={sharedClass}
                value={value}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
                placeholder={placeholder}
                type={type}
                min={min}
                max={max}
              />
            )}
            {suffix ? (
              <span className="shrink-0 font-sans text-sm font-semibold text-white/44">{suffix}</span>
            ) : null}
          </span>
          {helper ? <span className="mt-3 block">{helper}</span> : null}
        </span>
      </span>
    </motion.label>
  );
}
