"use client";

import { Settings, UsersRound } from "lucide-react";
import { AboutGQButton } from "@/components/AboutGQButton";
import { MagneticNavButton } from "@/components/MagneticNavButton";
import { PlaygroundButton } from "@/components/PlaygroundButton";

type NavigationBarProps = {
  isHome: boolean;
  onAbout: () => void;
  onJoinQuiz: () => void;
};

export function NavigationBar({ isHome, onAbout, onJoinQuiz }: NavigationBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex items-start justify-between gap-2 px-3 sm:top-6 sm:px-8">
      <div className="pointer-events-auto shrink-0">
        {isHome ? <PlaygroundButton /> : null}
      </div>
      <div className="pointer-events-auto flex min-w-0 flex-wrap justify-end gap-2 sm:flex-nowrap sm:gap-3">
        {isHome ? <AboutGQButton onClick={onAbout} /> : null}
        <MagneticNavButton icon={UsersRound} ariaLabel="Join a quiz" onClick={onJoinQuiz} compact tone="emerald">
          Join
        </MagneticNavButton>
        <MagneticNavButton icon={Settings} ariaLabel="Open settings" circular tone="fuchsia">
          Settings
        </MagneticNavButton>
      </div>
    </div>
  );
}
