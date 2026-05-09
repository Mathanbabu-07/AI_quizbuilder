"use client";

import { Wand2 } from "lucide-react";
import { MagneticNavButton } from "@/components/MagneticNavButton";

type CreateQuizButtonProps = {
  onClick: () => void;
};

export function CreateQuizButton({ onClick }: CreateQuizButtonProps) {
  return (
    <MagneticNavButton icon={Wand2} ariaLabel="Create a quiz" onClick={onClick} compact tone="cyan">
      Create a Quiz
    </MagneticNavButton>
  );
}
