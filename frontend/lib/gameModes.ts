export type GameModeSlug = "hand-cricket" | "emoji-rush" | "memory-grid";

export type GameMode = {
  slug: GameModeSlug;
  title: string;
  eyebrow: string;
  description: string;
  path: `/games/${GameModeSlug}`;
  tone: "cricket" | "emoji" | "memory";
};

export const gameModes: GameMode[] = [
  {
    slug: "hand-cricket",
    title: "HAND CRICKET",
    eyebrow: "Digital Stadium",
    description: "A neon sports arena for quick reflex cricket battles.",
    path: "/games/hand-cricket",
    tone: "cricket"
  },
  {
    slug: "emoji-rush",
    title: "EMOJI RUSH",
    eyebrow: "Combo Arcade",
    description: "A vibrant match-3 arcade run built for fast combo chains.",
    path: "/games/emoji-rush",
    tone: "emoji"
  },
  {
    slug: "memory-grid",
    title: "MEMORY GRID",
    eyebrow: "Neural Tiles",
    description: "A futuristic memory grid with hologram tile patterns.",
    path: "/games/memory-grid",
    tone: "memory"
  }
];

export function getGameMode(slug: string): GameMode | undefined {
  return gameModes.find((game) => game.slug === slug);
}
