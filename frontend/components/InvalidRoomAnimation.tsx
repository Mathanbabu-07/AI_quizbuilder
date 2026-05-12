"use client";

import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";

type InvalidRoomAnimationProps = {
  message: string;
};

export function InvalidRoomAnimation({ message }: InvalidRoomAnimationProps) {
  return (
    <motion.div
      className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200/24 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-50 shadow-[0_0_28px_rgba(244,63,94,0.14)]"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-100/20 bg-rose-200/10">
        <TriangleAlert className="size-4" />
      </span>
      <span>{message}</span>
    </motion.div>
  );
}
