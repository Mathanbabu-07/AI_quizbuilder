"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type WaitingStatusProps = {
  started?: boolean;
};

export function WaitingStatus({ started = false }: WaitingStatusProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-center shadow-[0_12px_38px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
      <motion.span
        animate={{ rotate: started ? 0 : 360 }}
        transition={{ duration: 2.2, repeat: started ? 0 : Infinity, ease: "linear" }}
        className="text-cyan-100/78"
      >
        <Loader2 className="size-4" />
      </motion.span>
      <motion.p
        className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-white/70 sm:text-sm"
        animate={{ opacity: [0.56, 1, 0.56] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {started ? "Host launched the arena..." : "Waiting for host to start..."}
      </motion.p>
    </div>
  );
}
