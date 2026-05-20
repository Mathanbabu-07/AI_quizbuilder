export type EmojiRushRoundConfig = {
  round: number;
  title: string;
  boardSize: number;
  emojiVariety: number;
  targetPoints: number;
  moveLimit: number;
  timeLimitSeconds: number;
  difficulty: "Sweet" | "Zesty" | "Wild" | "Fever" | "Legend";
};

export const EMOJI_POOL = ["🍓", "🍋", "🍇", "🍬", "💎", "🌟", "🍒", "🧁"];

export const ROUND_CONFIGS: EmojiRushRoundConfig[] = [
  {
    round: 1,
    title: "Sugar Toss",
    boardSize: 7,
    emojiVariety: 5,
    targetPoints: 14,
    moveLimit: 24,
    timeLimitSeconds: 90,
    difficulty: "Sweet"
  },
  {
    round: 2,
    title: "Candy Sprint",
    boardSize: 7,
    emojiVariety: 6,
    targetPoints: 14,
    moveLimit: 22,
    timeLimitSeconds: 84,
    difficulty: "Zesty"
  },
  {
    round: 3,
    title: "Combo Skies",
    boardSize: 8,
    emojiVariety: 6,
    targetPoints: 14,
    moveLimit: 20,
    timeLimitSeconds: 78,
    difficulty: "Wild"
  },
  {
    round: 4,
    title: "Emoji Fever",
    boardSize: 9,
    emojiVariety: 7,
    targetPoints: 14,
    moveLimit: 18,
    timeLimitSeconds: 72,
    difficulty: "Fever"
  },
  {
    round: 5,
    title: "Golden Rush",
    boardSize: 9,
    emojiVariety: 8,
    targetPoints: 14,
    moveLimit: 16,
    timeLimitSeconds: 66,
    difficulty: "Legend"
  }
];

export function getRoundConfig(round: number) {
  return ROUND_CONFIGS[Math.max(0, Math.min(ROUND_CONFIGS.length - 1, round - 1))];
}

export function getRoundEmojis(config: EmojiRushRoundConfig) {
  return EMOJI_POOL.slice(0, config.emojiVariety);
}

export function medalForRounds(completedRounds: number) {
  if (completedRounds >= 5) {
    return "gold" as const;
  }

  if (completedRounds === 4) {
    return "silver" as const;
  }

  if (completedRounds === 3) {
    return "bronze" as const;
  }

  return "none" as const;
}
