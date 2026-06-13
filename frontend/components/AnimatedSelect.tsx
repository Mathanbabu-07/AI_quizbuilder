"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { memo, useEffect, useRef, useState } from "react";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type SelectOption = {
  label: string;
  value: string;
  tone?: string;
};

type AnimatedSelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon: IconType;
};

function AnimatedSelectComponent({ label, value, options, onChange, icon: Icon }: AnimatedSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        className="group relative isolate flex min-h-24 w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.065] px-5 py-4 text-left shadow-[0_18px_52px_rgba(0,0,0,0.28)] outline-none backdrop-blur-2xl transition-colors duration-300 hover:border-cyan-100/28 focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-6"
        onClick={() => setOpen((current) => !current)}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(103,232,249,0.12),transparent_38%),linear-gradient(115deg,transparent,rgba(103,232,249,0.12),transparent)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-cyan-100/15 bg-cyan-100/8 text-cyan-100 shadow-[0_0_20px_rgba(103,232,249,0.12)]">
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-2 block font-display text-[0.68rem] font-bold uppercase text-white/42">
            {label}
          </span>
          <span className={`block truncate font-sans text-base font-semibold text-white ${selected.tone ?? ""}`}>
            {selected.label}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown className="size-5 text-white/45" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-2xl border border-white/14 bg-slate-950/88 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.46),0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className="group/option flex w-full items-center justify-between rounded-xl px-3 py-3 text-left font-sans text-sm font-semibold text-white/72 transition-colors duration-200 hover:bg-white/8 hover:text-white"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={active}
                >
                  <span className={option.tone}>{option.label}</span>
                  {active ? <Check className="size-4 text-cyan-100" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const AnimatedSelect = memo(AnimatedSelectComponent);

