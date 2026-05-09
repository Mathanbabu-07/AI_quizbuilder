"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CodeSnippetBlockProps = {
  code: string;
  copyable?: boolean;
};

export function CodeSnippetBlock({ code, copyable = true }: CodeSnippetBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-cyan-100/18 bg-slate-950/72 shadow-[0_0_38px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.045] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-rose-300/70" />
          <span className="size-2.5 rounded-full bg-amber-200/70" />
          <span className="size-2.5 rounded-full bg-emerald-300/70" />
        </div>
        {copyable ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 font-sans text-[0.68rem] font-bold uppercase text-white/56 transition-colors duration-200 hover:border-cyan-100/28 hover:text-cyan-50"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : (
          <span className="font-sans text-[0.65rem] font-bold uppercase text-white/34">Snippet</span>
        )}
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-left font-mono text-[0.82rem] leading-6 text-cyan-50/86 [tab-size:2] sm:text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
