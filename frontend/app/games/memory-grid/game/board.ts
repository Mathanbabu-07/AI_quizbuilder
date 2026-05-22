"use client";

import {
  MEMORY_CARD_ASSETS,
  type MemoryCardAsset,
  type MemoryGridRoundConfig
} from "@/app/games/memory-grid/game/config";

export type MemoryGridCardStatus = "idle" | "matched" | "wrong";

export type MemoryGridCard = {
  id: string;
  asset: MemoryCardAsset;
  row: number;
  col: number;
  status: MemoryGridCardStatus;
  createdAt: number;
};

export type MemoryGridPoint = {
  row: number;
  col: number;
};

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function createMemoryGrid(config: MemoryGridRoundConfig) {
  const totalCards = config.rows * config.cols;
  const assets = shuffle(MEMORY_CARD_ASSETS).slice(0, totalCards);
  const targetCards = shuffle(assets).slice(0, config.targetCount);
  const createdAt = Date.now();

  return {
    cards: assets.map((asset, index) => ({
      id: `${config.round}_${asset.id}_${index}`,
      asset,
      row: Math.floor(index / config.cols),
      col: index % config.cols,
      status: "idle" as MemoryGridCardStatus,
      createdAt: createdAt + index * 18
    })),
    targetQueue: targetCards.map((asset) => `${config.round}_${asset.id}_${assets.indexOf(asset)}`)
  };
}

export function scoreMemoryPick(round: number, remainingSeconds: number, combo: number) {
  return 120 + round * 18 + Math.max(0, remainingSeconds) * 3 + Math.min(5, combo) * 12;
}

export function cardAtPoint(cards: MemoryGridCard[], point: MemoryGridPoint) {
  return cards.find((card) => card.row === point.row && card.col === point.col) ?? null;
}

export function calculateAccuracy(correctSelections: number, wrongSelections: number) {
  const total = correctSelections + wrongSelections;
  if (total <= 0) {
    return 100;
  }
  return Math.round((correctSelections / total) * 1000) / 10;
}
