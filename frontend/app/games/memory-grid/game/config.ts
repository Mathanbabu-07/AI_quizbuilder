"use client";

export type MemoryGridRoundConfig = {
  round: number;
  title: string;
  rows: number;
  cols: number;
  memorizeSeconds: number;
  targetCount: number;
  findSeconds: number;
};

export type MemoryCardAsset = {
  id: string;
  label: string;
  emoji: string;
  palette: {
    base: number;
    deep: number;
    glow: number;
    shine: number;
  };
  css: {
    from: string;
    via: string;
    to: string;
  };
};

export const MEMORY_GRID_ROUNDS: MemoryGridRoundConfig[] = [
  { round: 1, title: "Focus Bloom", rows: 2, cols: 2, memorizeSeconds: 10, targetCount: 3, findSeconds: 30 },
  { round: 2, title: "Pattern Rise", rows: 3, cols: 3, memorizeSeconds: 10, targetCount: 3, findSeconds: 30 },
  { round: 3, title: "Recall Drift", rows: 3, cols: 3, memorizeSeconds: 10, targetCount: 3, findSeconds: 30 },
  { round: 4, title: "Deep Focus", rows: 4, cols: 3, memorizeSeconds: 10, targetCount: 4, findSeconds: 30 },
  { round: 5, title: "Memory Crown", rows: 4, cols: 4, memorizeSeconds: 10, targetCount: 4, findSeconds: 30 }
];

export const MAX_MEMORY_GRID_HEARTS = 4;

export const MEMORY_CARD_ASSETS: MemoryCardAsset[] = [
  {
    id: "red-panda",
    label: "Red Panda",
    emoji: "🦊",
    palette: { base: 0xff8a36, deep: 0xb7471f, glow: 0xffc06f, shine: 0xfff1c2 },
    css: { from: "#fff1c2", via: "#ff8a36", to: "#9f3412" }
  },
  {
    id: "sea-turtle",
    label: "Sea Turtle",
    emoji: "🐢",
    palette: { base: 0x20c997, deep: 0x087f5b, glow: 0x8cebd0, shine: 0xdbfff3 },
    css: { from: "#dbfff3", via: "#20c997", to: "#087f5b" }
  },
  {
    id: "macaw",
    label: "Macaw",
    emoji: "🦜",
    palette: { base: 0x38bdf8, deep: 0x1d4ed8, glow: 0xfacc15, shine: 0xe0f2fe },
    css: { from: "#e0f2fe", via: "#38bdf8", to: "#1d4ed8" }
  },
  {
    id: "strawberry",
    label: "Strawberry",
    emoji: "🍓",
    palette: { base: 0xff3b64, deep: 0xbe123c, glow: 0xff8ea6, shine: 0xffd6df },
    css: { from: "#ffd6df", via: "#ff3b64", to: "#be123c" }
  },
  {
    id: "kiwi",
    label: "Kiwi",
    emoji: "🥝",
    palette: { base: 0x84cc16, deep: 0x3f6212, glow: 0xd9f99d, shine: 0xf7fee7 },
    css: { from: "#f7fee7", via: "#84cc16", to: "#3f6212" }
  },
  {
    id: "blueberry",
    label: "Blueberry",
    emoji: "🫐",
    palette: { base: 0x4f46e5, deep: 0x312e81, glow: 0xa5b4fc, shine: 0xe0e7ff },
    css: { from: "#e0e7ff", via: "#4f46e5", to: "#312e81" }
  },
  {
    id: "camera",
    label: "Camera",
    emoji: "📷",
    palette: { base: 0x94a3b8, deep: 0x334155, glow: 0xcbd5e1, shine: 0xf8fafc },
    css: { from: "#f8fafc", via: "#94a3b8", to: "#334155" }
  },
  {
    id: "rocket",
    label: "Rocket",
    emoji: "🚀",
    palette: { base: 0xf97316, deep: 0x9a3412, glow: 0xfdba74, shine: 0xffedd5 },
    css: { from: "#ffedd5", via: "#f97316", to: "#9a3412" }
  },
  {
    id: "robot",
    label: "Robot",
    emoji: "🤖",
    palette: { base: 0x67e8f9, deep: 0x0e7490, glow: 0xa5f3fc, shine: 0xecfeff },
    css: { from: "#ecfeff", via: "#67e8f9", to: "#0e7490" }
  },
  {
    id: "dice",
    label: "Dice",
    emoji: "🎲",
    palette: { base: 0xffffff, deep: 0x64748b, glow: 0xfef3c7, shine: 0xffffff },
    css: { from: "#ffffff", via: "#fef3c7", to: "#64748b" }
  },
  {
    id: "balloon",
    label: "Balloon",
    emoji: "🎈",
    palette: { base: 0xef4444, deep: 0x991b1b, glow: 0xfca5a5, shine: 0xfee2e2 },
    css: { from: "#fee2e2", via: "#ef4444", to: "#991b1b" }
  },
  {
    id: "gem",
    label: "Crystal Gem",
    emoji: "💎",
    palette: { base: 0x22d3ee, deep: 0x2563eb, glow: 0x99f6e4, shine: 0xecfeff },
    css: { from: "#ecfeff", via: "#22d3ee", to: "#2563eb" }
  },
  {
    id: "lion",
    label: "Lion",
    emoji: "🦁",
    palette: { base: 0xfbbf24, deep: 0x92400e, glow: 0xfde68a, shine: 0xfffbeb },
    css: { from: "#fffbeb", via: "#fbbf24", to: "#92400e" }
  },
  {
    id: "penguin",
    label: "Penguin",
    emoji: "🐧",
    palette: { base: 0x38bdf8, deep: 0x111827, glow: 0xbae6fd, shine: 0xffffff },
    css: { from: "#ffffff", via: "#38bdf8", to: "#111827" }
  },
  {
    id: "butterfly",
    label: "Butterfly",
    emoji: "🦋",
    palette: { base: 0x60a5fa, deep: 0x7c3aed, glow: 0xc4b5fd, shine: 0xeff6ff },
    css: { from: "#eff6ff", via: "#60a5fa", to: "#7c3aed" }
  },
  {
    id: "sunflower",
    label: "Sunflower",
    emoji: "🌻",
    palette: { base: 0xfacc15, deep: 0x854d0e, glow: 0xfef08a, shine: 0xfefce8 },
    css: { from: "#fefce8", via: "#facc15", to: "#854d0e" }
  },
  {
    id: "pineapple",
    label: "Pineapple",
    emoji: "🍍",
    palette: { base: 0xfbbf24, deep: 0x15803d, glow: 0xfef08a, shine: 0xfefce8 },
    css: { from: "#fefce8", via: "#fbbf24", to: "#15803d" }
  },
  {
    id: "gift",
    label: "Gift Box",
    emoji: "🎁",
    palette: { base: 0xf43f5e, deep: 0x881337, glow: 0xfda4af, shine: 0xfff1f2 },
    css: { from: "#fff1f2", via: "#f43f5e", to: "#881337" }
  },
  {
    id: "soccer",
    label: "Soccer Ball",
    emoji: "⚽",
    palette: { base: 0xf8fafc, deep: 0x0f172a, glow: 0xe2e8f0, shine: 0xffffff },
    css: { from: "#ffffff", via: "#e2e8f0", to: "#0f172a" }
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    palette: { base: 0xa78bfa, deep: 0x5b21b6, glow: 0xddd6fe, shine: 0xf5f3ff },
    css: { from: "#f5f3ff", via: "#a78bfa", to: "#5b21b6" }
  },
  {
    id: "teddy",
    label: "Teddy",
    emoji: "🧸",
    palette: { base: 0xc08457, deep: 0x7c2d12, glow: 0xfed7aa, shine: 0xffedd5 },
    css: { from: "#ffedd5", via: "#c08457", to: "#7c2d12" }
  },
  {
    id: "unicorn",
    label: "Unicorn",
    emoji: "🦄",
    palette: { base: 0xf0abfc, deep: 0xa21caf, glow: 0xf5d0fe, shine: 0xfdf4ff },
    css: { from: "#fdf4ff", via: "#f0abfc", to: "#a21caf" }
  },
  {
    id: "pizza",
    label: "Pizza",
    emoji: "🍕",
    palette: { base: 0xfb923c, deep: 0xb45309, glow: 0xfcd34d, shine: 0xfffbeb },
    css: { from: "#fffbeb", via: "#fb923c", to: "#b45309" }
  },
  {
    id: "sushi",
    label: "Sushi",
    emoji: "🍣",
    palette: { base: 0xfb7185, deep: 0xbe123c, glow: 0xfecdd3, shine: 0xfff1f2 },
    css: { from: "#fff1f2", via: "#fb7185", to: "#be123c" }
  },
  {
    id: "moon",
    label: "Moon",
    emoji: "🌙",
    palette: { base: 0xfde68a, deep: 0x475569, glow: 0xfef3c7, shine: 0xfffbeb },
    css: { from: "#fffbeb", via: "#fde68a", to: "#475569" }
  },
  {
    id: "rainbow",
    label: "Rainbow",
    emoji: "🌈",
    palette: { base: 0x22d3ee, deep: 0xc026d3, glow: 0xfef08a, shine: 0xffffff },
    css: { from: "#ffffff", via: "#22d3ee", to: "#c026d3" }
  },
  {
    id: "owl",
    label: "Owl",
    emoji: "🦉",
    palette: { base: 0xd97706, deep: 0x78350f, glow: 0xfcd34d, shine: 0xfffbeb },
    css: { from: "#fffbeb", via: "#d97706", to: "#78350f" }
  },
  {
    id: "car",
    label: "Sports Car",
    emoji: "🏎️",
    palette: { base: 0xef4444, deep: 0x7f1d1d, glow: 0xfca5a5, shine: 0xfee2e2 },
    css: { from: "#fee2e2", via: "#ef4444", to: "#7f1d1d" }
  },
  {
    id: "watch",
    label: "Watch",
    emoji: "⌚",
    palette: { base: 0x2dd4bf, deep: 0x115e59, glow: 0x99f6e4, shine: 0xf0fdfa },
    css: { from: "#f0fdfa", via: "#2dd4bf", to: "#115e59" }
  },
  {
    id: "crown",
    label: "Crown",
    emoji: "👑",
    palette: { base: 0xfacc15, deep: 0xa16207, glow: 0xfef08a, shine: 0xfefce8 },
    css: { from: "#fefce8", via: "#facc15", to: "#a16207" }
  }
];

export function getMemoryRoundConfig(round: number) {
  return MEMORY_GRID_ROUNDS.find((config) => config.round === round) ?? MEMORY_GRID_ROUNDS[0];
}

export function memoryGridMedalFor(completedRounds: number) {
  if (completedRounds >= 5) {
    return "gold" as const;
  }
  if (completedRounds >= 4) {
    return "silver" as const;
  }
  if (completedRounds >= 3) {
    return "bronze" as const;
  }
  return "none" as const;
}
