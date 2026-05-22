"use client";

import { create } from "zustand";
import { calculateAccuracy, createMemoryGrid, scoreMemoryPick, type MemoryGridCard } from "@/app/games/memory-grid/game/board";
import {
  MAX_MEMORY_GRID_HEARTS,
  getMemoryRoundConfig,
  memoryGridMedalFor
} from "@/app/games/memory-grid/game/config";

export type MemoryGridPhase = "intro" | "memorize" | "find" | "paused" | "round-complete" | "game-over" | "victory";
export type MemoryGridMedal = "gold" | "silver" | "bronze" | "none";
export type MemoryGridResult = "active" | "victory" | "game_over" | "abandoned";
export type BackendStatus = "idle" | "saving" | "synced" | "offline" | "error";

export type MemoryGridEffect = {
  id: string;
  type: "correct" | "wrong" | "heart" | "timeout" | "round";
  cardId?: string;
  createdAt: number;
};

export type MemoryGridRoundResult = {
  id: string;
  roundNumber: number;
  score: number;
  correctTargets: number;
  wrongAttempts: number;
  totalSelections: number;
  remainingHearts: number;
  durationMs: number;
  completed: boolean;
  gridRows: number;
  gridCols: number;
  memorizeSeconds: number;
  targetCount: number;
};

type MemoryGridState = {
  phase: MemoryGridPhase;
  previousPhase: MemoryGridPhase | null;
  sessionId: string | null;
  playerId: string;
  playerName: string;
  round: number;
  cards: MemoryGridCard[];
  targetQueue: string[];
  targetIndex: number;
  hearts: number;
  totalScore: number;
  roundScore: number;
  memorizeLeft: number;
  findLeft: number;
  combo: number;
  bestCombo: number;
  completedRounds: number;
  correctSelections: number;
  wrongSelections: number;
  roundWrongAttempts: number;
  roundSelections: number;
  roundStartedAt: number;
  gameStartedAt: number;
  lastRoundResult: MemoryGridRoundResult | null;
  medal: MemoryGridMedal;
  result: MemoryGridResult;
  effects: MemoryGridEffect[];
  backendStatus: BackendStatus;
  backendMessage: string;
  lastHeartEvent: {
    id: string;
    roundNumber: number;
    remainingHearts: number;
    wrongAttempts: number;
    reason: "wrong_selection" | "timeout";
  } | null;
  startGame: (playerId: string, playerName: string) => void;
  attachSession: (sessionId: string) => void;
  setBackendStatus: (status: BackendStatus, message?: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tick: () => void;
  selectCard: (cardId: string) => void;
  continueNextRound: () => void;
  finishGame: () => void;
  restartGame: () => void;
  clearEffects: () => void;
};

const FX_TTL = 980;

const initialState = {
  phase: "intro" as MemoryGridPhase,
  previousPhase: null as MemoryGridPhase | null,
  sessionId: null,
  playerId: "",
  playerName: "Player",
  round: 1,
  cards: [] as MemoryGridCard[],
  targetQueue: [] as string[],
  targetIndex: 0,
  hearts: MAX_MEMORY_GRID_HEARTS,
  totalScore: 0,
  roundScore: 0,
  memorizeLeft: getMemoryRoundConfig(1).memorizeSeconds,
  findLeft: getMemoryRoundConfig(1).findSeconds,
  combo: 0,
  bestCombo: 0,
  completedRounds: 0,
  correctSelections: 0,
  wrongSelections: 0,
  roundWrongAttempts: 0,
  roundSelections: 0,
  roundStartedAt: 0,
  gameStartedAt: 0,
  lastRoundResult: null as MemoryGridRoundResult | null,
  medal: "none" as MemoryGridMedal,
  result: "active" as MemoryGridResult,
  effects: [] as MemoryGridEffect[],
  backendStatus: "idle" as BackendStatus,
  backendMessage: "",
  lastHeartEvent: null as MemoryGridState["lastHeartEvent"]
};

function effectId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 100000)}`;
}

function setupRound(round: number) {
  const config = getMemoryRoundConfig(round);
  const grid = createMemoryGrid(config);

  return {
    round,
    cards: grid.cards,
    targetQueue: grid.targetQueue,
    targetIndex: 0,
    roundScore: 0,
    memorizeLeft: config.memorizeSeconds,
    findLeft: config.findSeconds,
    combo: 0,
    roundWrongAttempts: 0,
    roundSelections: 0,
    roundStartedAt: Date.now(),
    lastRoundResult: null,
    effects: [
      {
        id: effectId("round"),
        type: "round" as const,
        createdAt: Date.now()
      }
    ]
  };
}

function createRoundResult(state: MemoryGridState, completed: boolean): MemoryGridRoundResult {
  const config = getMemoryRoundConfig(state.round);
  return {
    id: `${state.round}_${Date.now()}`,
    roundNumber: state.round,
    score: state.roundScore,
    correctTargets: state.targetIndex,
    wrongAttempts: state.roundWrongAttempts,
    totalSelections: state.roundSelections,
    remainingHearts: state.hearts,
    durationMs: Math.max(800, Date.now() - state.roundStartedAt),
    completed,
    gridRows: config.rows,
    gridCols: config.cols,
    memorizeSeconds: config.memorizeSeconds,
    targetCount: config.targetCount
  };
}

function addEffect(state: MemoryGridState, effect: Omit<MemoryGridEffect, "id" | "createdAt">) {
  return [
    ...state.effects,
    {
      id: effectId(effect.type),
      createdAt: Date.now(),
      ...effect
    }
  ];
}

export const useMemoryGridStore = create<MemoryGridState>((set, get) => ({
  ...initialState,

  startGame: (playerId, playerName) => {
    set({
      ...initialState,
      ...setupRound(1),
      phase: "memorize",
      playerId,
      playerName: playerName.trim() || "Player",
      gameStartedAt: Date.now(),
      backendStatus: "saving",
      backendMessage: "Starting secure Memory Grid session"
    });
  },

  attachSession: (sessionId) => {
    set({
      sessionId,
      backendStatus: "synced",
      backendMessage: "Secure session ready"
    });
  },

  setBackendStatus: (status, message = "") => {
    set({ backendStatus: status, backendMessage: message });
  },

  pauseGame: () => {
    const state = get();
    if (state.phase === "memorize" || state.phase === "find") {
      set({ phase: "paused", previousPhase: state.phase });
    }
  },

  resumeGame: () => {
    const state = get();
    if (state.phase === "paused") {
      set({ phase: state.previousPhase ?? "find", previousPhase: null });
    }
  },

  tick: () => {
    const state = get();
    if (state.phase === "memorize") {
      const next = Math.max(0, state.memorizeLeft - 1);
      if (next > 0) {
        set({ memorizeLeft: next });
        return;
      }
      set({
        memorizeLeft: 0,
        findLeft: getMemoryRoundConfig(state.round).findSeconds,
        phase: "find",
        backendMessage: "Find the target image"
      });
      return;
    }

    if (state.phase !== "find") {
      return;
    }

    const next = Math.max(0, state.findLeft - 1);
    if (next > 0) {
      set({ findLeft: next });
      return;
    }

    const nextHearts = Math.max(0, state.hearts - 1);
    const nextWrong = state.wrongSelections + 1;
    const nextRoundWrong = state.roundWrongAttempts + 1;
    const lastHeartEvent = {
      id: effectId("heart"),
      roundNumber: state.round,
      remainingHearts: nextHearts,
      wrongAttempts: nextRoundWrong,
      reason: "timeout" as const
    };

    if (nextHearts <= 0) {
      set({
        hearts: 0,
        wrongSelections: nextWrong,
        roundWrongAttempts: nextRoundWrong,
        phase: "game-over",
        result: "game_over",
        medal: memoryGridMedalFor(state.completedRounds),
        lastRoundResult: createRoundResult({ ...state, hearts: 0, roundWrongAttempts: nextRoundWrong }, false),
        lastHeartEvent,
        effects: addEffect(state, { type: "timeout" })
      });
      return;
    }

    set({
      ...setupRound(state.round),
      phase: "memorize",
      hearts: nextHearts,
      wrongSelections: nextWrong,
      lastHeartEvent,
      backendMessage: "Timer missed. Memorize this round again.",
      effects: addEffect(state, { type: "timeout" })
    });
  },

  selectCard: (cardId) => {
    const state = get();
    if (state.phase !== "find") {
      return;
    }

    const selected = state.cards.find((card) => card.id === cardId);
    if (!selected || selected.status === "matched") {
      return;
    }

    const targetCardId = state.targetQueue[state.targetIndex];
    const roundSelections = state.roundSelections + 1;

    if (cardId !== targetCardId) {
      const nextHearts = Math.max(0, state.hearts - 1);
      const nextWrong = state.wrongSelections + 1;
      const nextRoundWrong = state.roundWrongAttempts + 1;
      const lastHeartEvent = {
        id: effectId("heart"),
        roundNumber: state.round,
        remainingHearts: nextHearts,
        wrongAttempts: nextRoundWrong,
        reason: "wrong_selection" as const
      };

      set({
        cards: state.cards.map((card) => (card.id === cardId ? { ...card, status: "wrong" } : card)),
        hearts: nextHearts,
        combo: 0,
        wrongSelections: nextWrong,
        roundWrongAttempts: nextRoundWrong,
        roundSelections,
        phase: nextHearts <= 0 ? "game-over" : "find",
        result: nextHearts <= 0 ? "game_over" : state.result,
        medal: nextHearts <= 0 ? memoryGridMedalFor(state.completedRounds) : state.medal,
        lastRoundResult:
          nextHearts <= 0
            ? createRoundResult({ ...state, hearts: nextHearts, roundWrongAttempts: nextRoundWrong, roundSelections }, false)
            : state.lastRoundResult,
        lastHeartEvent,
        backendMessage: nextHearts <= 0 ? "No hearts left" : "Wrong tile. Stay focused.",
        effects: addEffect(state, { type: "wrong", cardId })
      });

      window.setTimeout(() => {
        const latest = get();
        if (latest.phase === "find") {
          set({
            cards: latest.cards.map((card) => (card.id === cardId && card.status === "wrong" ? { ...card, status: "idle" } : card))
          });
        }
      }, 420);
      return;
    }

    const nextCombo = state.combo + 1;
    const gained = scoreMemoryPick(state.round, state.findLeft, nextCombo);
    const nextTargetIndex = state.targetIndex + 1;
    const config = getMemoryRoundConfig(state.round);
    const completed = nextTargetIndex >= config.targetCount;
    const nextCards = state.cards.map((card) => (card.id === cardId ? { ...card, status: "matched" as const } : card));
    const nextRoundScore = state.roundScore + gained;
    const nextTotalScore = state.totalScore + gained;
    const nextCompletedRounds = completed ? Math.max(state.completedRounds, state.round) : state.completedRounds;
    const nextState = {
      ...state,
      cards: nextCards,
      targetIndex: nextTargetIndex,
      roundScore: nextRoundScore,
      totalScore: nextTotalScore,
      combo: nextCombo,
      bestCombo: Math.max(state.bestCombo, nextCombo),
      completedRounds: nextCompletedRounds,
      correctSelections: state.correctSelections + 1,
      roundSelections,
      phase: completed ? ("round-complete" as MemoryGridPhase) : ("find" as MemoryGridPhase)
    };

    set({
      cards: nextCards,
      targetIndex: nextTargetIndex,
      roundScore: nextRoundScore,
      totalScore: nextTotalScore,
      combo: nextCombo,
      bestCombo: Math.max(state.bestCombo, nextCombo),
      completedRounds: nextCompletedRounds,
      correctSelections: state.correctSelections + 1,
      roundSelections,
      phase: completed ? "round-complete" : "find",
      medal: memoryGridMedalFor(nextCompletedRounds),
      lastRoundResult: completed ? createRoundResult(nextState as MemoryGridState, true) : state.lastRoundResult,
      backendMessage: completed ? `Round ${state.round} complete` : "Correct. Next target ready.",
      effects: addEffect(state, { type: "correct", cardId })
    });
  },

  continueNextRound: () => {
    const state = get();
    if (state.phase !== "round-complete") {
      return;
    }
    if (state.round >= 5) {
      get().finishGame();
      return;
    }

    set({
      ...setupRound(state.round + 1),
      phase: "memorize",
      backendMessage: `Round ${state.round + 1} ready`
    });
  },

  finishGame: () => {
    const state = get();
    set({
      phase: "victory",
      result: "victory",
      medal: memoryGridMedalFor(state.completedRounds),
      backendMessage: "Memory Grid complete"
    });
  },

  restartGame: () => {
    set({ ...initialState });
  },

  clearEffects: () => {
    const now = Date.now();
    set((state) => ({
      effects: state.effects.filter((effect) => now - effect.createdAt < FX_TTL)
    }));
  }
}));

export function getMemoryGridAccuracy() {
  const state = useMemoryGridStore.getState();
  return calculateAccuracy(state.correctSelections, state.wrongSelections);
}

export function getMemoryGridCompletionTime() {
  const state = useMemoryGridStore.getState();
  if (!state.gameStartedAt) {
    return 0;
  }
  return Math.max(0, Date.now() - state.gameStartedAt);
}
