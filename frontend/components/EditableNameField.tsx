"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";

type EditableNameFieldProps = {
  name: string;
  editable: boolean;
  onSave: (name: string) => Promise<boolean> | boolean;
};

export function EditableNameField({ name, editable, onSave }: EditableNameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    if (!isEditing) {
      setDraftName(name);
    }
  }, [isEditing, name]);

  const save = async () => {
    const saved = await onSave(draftName);
    if (saved) {
      setIsEditing(false);
    }
  };

  if (!editable) {
    return <span className="truncate font-display text-base font-extrabold text-white sm:text-lg">{name}</span>;
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key="input"
            className="flex min-w-0 flex-1 items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void save();
                }
                if (event.key === "Escape") {
                  setIsEditing(false);
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-xl border border-cyan-100/24 bg-slate-950/42 px-3 font-display text-sm font-bold text-white outline-none shadow-[0_0_24px_rgba(34,211,238,0.1)] transition-colors placeholder:text-white/28 focus:border-cyan-100/60"
              maxLength={24}
              autoFocus
            />
            <button
              type="button"
              onClick={() => void save()}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100/24 bg-emerald-200/10 text-emerald-50"
              aria-label="Save name"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.055] text-white/68"
              aria-label="Cancel name edit"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="label"
            className="flex min-w-0 flex-1 items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <span className="truncate font-display text-base font-extrabold text-white sm:text-lg">{name}</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-100/16 bg-cyan-200/8 text-cyan-100/72 transition-colors hover:border-cyan-100/38 hover:text-cyan-50"
              aria-label="Edit name"
            >
              <Pencil className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
