"use client";

import { Gamepad2 } from "lucide-react";
import { MagneticNavButton } from "@/components/MagneticNavButton";

export function PlaygroundButton() {
  return (
    <MagneticNavButton icon={Gamepad2} ariaLabel="Open playground" compact>
      Playground
    </MagneticNavButton>
  );
}
