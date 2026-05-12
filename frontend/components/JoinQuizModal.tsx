"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, LogIn, RadioTower, X } from "lucide-react";
import { InvalidRoomAnimation } from "@/components/InvalidRoomAnimation";

type JoinQuizModalProps = {
  open: boolean;
  isJoining: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onJoin: (roomCode: string) => Promise<boolean>;
};

export function JoinQuizModal({ open, isJoining, errorMessage, onClose, onJoin }: JoinQuizModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 20, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 240, damping: 20, mass: 0.35 });

  useEffect(() => {
    if (!open) {
      setRoomCode("");
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const joined = await onJoin(roomCode);
    if (joined) {
      setRoomCode("");
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close join modal"
            className="absolute inset-0 cursor-default bg-slate-950/58 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.form
            onSubmit={submit}
            className="relative isolate w-full max-w-lg overflow-hidden rounded-[2rem] border border-cyan-100/18 bg-slate-950/58 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.52),0_0_70px_rgba(34,211,238,0.14)] backdrop-blur-2xl sm:p-7"
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 18, scale: 0.97, filter: "blur(10px)" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent" />
            <span className="absolute -right-20 -top-20 -z-10 size-56 rounded-full bg-cyan-300/18 blur-3xl" />
            <span className="absolute -bottom-24 left-1/4 -z-10 size-52 rounded-full bg-fuchsia-400/12 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/62 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="pr-10">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-cyan-100/18 bg-cyan-200/10 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
                <RadioTower className="size-5" />
              </div>
              <p className="font-display text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-100/70">
                Realtime multiplayer
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">Join Quiz Arena</h2>
            </div>

            <label className="mt-7 block">
              <span className="sr-only">Room code</span>
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="Enter room code to join..."
                className="h-16 w-full rounded-2xl border border-white/12 bg-white/[0.06] px-5 font-display text-lg font-extrabold uppercase tracking-[0.16em] text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_rgba(34,211,238,0)] backdrop-blur-xl transition-all duration-300 placeholder:font-sans placeholder:text-sm placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-white/28 hover:border-cyan-100/28 focus:border-cyan-100/62 focus:shadow-[0_0_42px_rgba(34,211,238,0.16)]"
                maxLength={10}
                autoFocus
              />
            </label>

            <AnimatePresence>{errorMessage ? <InvalidRoomAnimation message={errorMessage} /> : null}</AnimatePresence>

            <motion.button
              type="submit"
              disabled={isJoining}
              className="group relative mt-6 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-100/30 px-6 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_0_42px_rgba(34,211,238,0.22),0_18px_48px_rgba(0,0,0,0.34)] outline-none transition-colors duration-300 disabled:cursor-wait disabled:opacity-70"
              style={{ x: springX, y: springY }}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                x.set((event.clientX - rect.left - rect.width / 2) * 0.08);
                y.set((event.clientY - rect.top - rect.height / 2) * 0.12);
              }}
              onMouseLeave={() => {
                x.set(0);
                y.set(0);
              }}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(45,212,191,0.92),rgba(14,165,233,0.84),rgba(168,85,247,0.78),rgba(45,212,191,0.92))] bg-[length:240%_100%] motion-safe:animate-[shine_4.8s_linear_infinite]" />
              <LogIn className="mr-3 size-4" />
              {isJoining ? "Joining..." : "Join Arena"}
              <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
