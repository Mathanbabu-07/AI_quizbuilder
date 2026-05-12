"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

type CopyCodeButtonProps = {
  code: string;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      className={`group inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] outline-none backdrop-blur-xl transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        copied
          ? "border-emerald-100/50 bg-emerald-300/16 text-emerald-50 shadow-[0_0_28px_rgba(52,211,153,0.2)]"
          : "border-cyan-100/24 bg-white/[0.065] text-cyan-50 hover:border-cyan-100/46 hover:bg-cyan-200/12"
      }`}
      whileHover={{ y: -1, scale: 1.025 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 430, damping: 28 }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </motion.button>
  );
}
