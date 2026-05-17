"use client";

import { PencilLine } from "lucide-react";
import { MagneticNavButton } from "@/components/MagneticNavButton";

type ManualCreateButtonProps = {
  onClick: () => void;
};

export function ManualCreateButton({ onClick }: ManualCreateButtonProps) {
  return (
    <MagneticNavButton icon={PencilLine} ariaLabel="Manual create" onClick={onClick} tone="fuchsia">
      Manual Create
    </MagneticNavButton>
  );
}
