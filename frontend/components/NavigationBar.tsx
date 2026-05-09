"use client";

import { Settings, UsersRound } from "lucide-react";
import { AboutGQButton } from "@/components/AboutGQButton";
import { CreateQuizButton } from "@/components/CreateQuizButton";
import { MagneticNavButton } from "@/components/MagneticNavButton";
import { PlaygroundButton } from "@/components/PlaygroundButton";

type NavigationBarProps = {
  onCreateQuiz: () => void;
  onAbout: () => void;
};

export function NavigationBar({ onCreateQuiz, onAbout }: NavigationBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex items-start justify-between gap-2 px-4 sm:top-6 sm:px-8">
      <div className="pointer-events-auto">
        <PlaygroundButton />
      </div>
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <CreateQuizButton onClick={onCreateQuiz} />
        <AboutGQButton onClick={onAbout} />
        <MagneticNavButton icon={UsersRound} ariaLabel="Join a quiz" compact tone="emerald">
          Join
        </MagneticNavButton>
        <MagneticNavButton icon={Settings} ariaLabel="Open settings" circular tone="fuchsia">
          Settings
        </MagneticNavButton>
      </div>
    </div>
  );
}
