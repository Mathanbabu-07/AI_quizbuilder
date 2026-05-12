"use client";

import { Info } from "lucide-react";
import { MagneticNavButton } from "@/components/MagneticNavButton";

type AboutGQButtonProps = {
  onClick: () => void;
};

export function AboutGQButton({ onClick }: AboutGQButtonProps) {
  return (
    <MagneticNavButton icon={Info} ariaLabel="About GENQUIZ" onClick={onClick} tone="cyan">
      About GQ
    </MagneticNavButton>
  );
}
