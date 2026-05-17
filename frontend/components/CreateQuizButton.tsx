"use client";

import { Wand2 } from "lucide-react";
import { MagneticNavButton } from "@/components/MagneticNavButton";

type CreateQuizButtonProps = {
  onClick: () => void;
};

export function CreateQuizButton({ onClick }: CreateQuizButtonProps) {
  return (
    <MagneticNavButton icon={Wand2} ariaLabel="Create with AI" onClick={onClick} tone="cyan">
      Create With AI
    </MagneticNavButton>
  );
}
