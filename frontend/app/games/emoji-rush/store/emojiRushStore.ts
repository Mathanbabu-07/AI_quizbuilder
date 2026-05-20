"use client";

import { create } from "zustand";
import {
  clearNewFlags,
  collapseBoard,
  createBoard,
  findMatches,
  hasAvailableMove,
  isAdjacent,
  markMatches,
  scoreMatches,
  swapTiles,
  type BoardPoint,
  type EmojiTile
} from "@/app/games/emoji-rush/game/board";
import { getRoundConfig, medalForRounds, type EmojiRushRoundConfig } from "@/app/games/emoji-rush/game/config";

export type EmojiRushPhase = "intro" | "playing" | "paused" | "round-complete" | "game-over";
export type EmojiRushMedal = "gold" | "silver" | "bronze" | "none";
export type BackendStatus = "idle" | "saving" | "synced" | "offline" | "error";

export type EmojiRushEffect = BoardPoint & {
  id: string;
  type: "pop" | "float" | "refresh";
  label: string;
  power: number;
  createdAt: number;
};

export type EmojiRushRoundResult = {
  id: string;
  roundNumber: number;
  points: number;
  match3Count: number;
  match5Count: number;
  maxCombo: number;
  moves: number;
  durationMs: number;
  completed: boolean;
  boardSize: number;
  emojiVariety: number;
};

type EmojiRushState = {
  phase: EmojiRushPhase;
  sessionId: string | null;
  playerId: string;
  playerName: string;
  round: number;
  board: EmojiTile[];
  totalScore: number;
  roundScore: number;
  roundMatch3Count: number;
  roundMatch5Count: number;
  movesLeft: number;
  movesUsed: number;
  timeLeft: number;
  combo: number;
  bestCombo: number;
  completedRounds: number;
  medal: EmojiRushMedal;
  isResolving: boolean;
  roundStartedAt: number;
  lastRoundResult: EmojiRushRoundResult | null;
  effects: EmojiRushEffect[];
  backendStatus: BackendStatus;
  backendMessage: string;
  startGame: (playerId: string, playerName: string) => void;
  attachSession: (sessionId: string) => void;
  setBackendStatus: (status: BackendStatus, message?: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tick: () => void;
  trySwap: (from: BoardPoint, to: BoardPoint) => Promise<void>;
  continueNextRound: () => void;
  repairRoundBoard: () => void;
  finishGame: () => void;
  restartGame: () => void;
  clearEffects: () => void;
};

const FX_TTL = 880;

const initialRuntime = {
  phase: "intro" as EmojiRushPhase,
  sessionId: null,
  playerId: "",
  playerName: "Player",
  round: 1,
  board: [] as EmojiTile[],
  totalScore: 0,
  roundScore: 0,
  roundMatch3Count: 0,
  roundMatch5Count: 0,
  movesLeft: getRoundConfig(1).moveLimit,
  movesUsed: 0,
  timeLeft: getRoundConfig(1).timeLimitSeconds,
  combo: 0,
  bestCombo: 0,
  completedRounds: 0,
  medal: "none" as EmojiRushMedal,
  isResolving: false,
  roundStartedAt: 0,
  lastRoundResult: null,
  effects: [] as EmojiRushEffect[],
  backendStatus: "idle" as BackendStatus,
  backendMessage: ""
};

function wait(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function effectId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 100000)}`;
}

function setupRound(config: EmojiRushRoundConfig) {
  return {
    round: config.round,
    board: createBoard(config),
    roundScore: 0,
    roundMatch3Count: 0,
    roundMatch5Count: 0,
    movesLeft: config.moveLimit,
    movesUsed: 0,
    timeLeft: config.timeLimitSeconds,
    combo: 0,
    isResolving: false,
    roundStartedAt: Date.now(),
    lastRoundResult: null,
    effects: []
  };
}

function createRoundResult(state: EmojiRushState, completed: boolean): EmojiRushRoundResult {
  const config = getRoundConfig(state.round);
  return {
    id: `${state.round}_${Date.now()}`,
    roundNumber: state.round,
    points: state.roundScore,
    match3Count: state.roundMatch3Count,
    match5Count: state.roundMatch5Count,
    maxCombo: state.bestCombo,
    moves: state.movesUsed,
    durationMs: Math.max(700, Date.now() - state.roundStartedAt),
    completed,
    boardSize: config.boardSize,
    emojiVariety: config.emojiVariety
  };
}

export const useEmojiRushStore = create<EmojiRushState>((set, get) => ({
  ...initialRuntime,

  startGame: (playerId, playerName) => {
    const config = getRoundConfig(1);
    set({
      ...initialRuntime,
      ...setupRound(config),
      phase: "playing",
      playerId,
      playerName: playerName.trim() || "Player",
      backendStatus: "saving",
      backendMessage: "Starting secure session"
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
    if (state.phase === "playing" && !state.isResolving) {
      set({ phase: "paused" });
    }
  },

  resumeGame: () => {
    const state = get();
    if (state.phase === "paused") {
      set({ phase: "playing" });
    }
  },

  tick: () => {
    const state = get();
    if (state.phase !== "playing" || state.isResolving) {
      return;
    }

    const nextTime = Math.max(0, state.timeLeft - 1);
    if (nextTime > 0) {
      set({ timeLeft: nextTime });
      return;
    }

    const config = getRoundConfig(state.round);
    if (state.roundScore >= config.targetPoints) {
      const result = createRoundResult({ ...state, timeLeft: 0 }, true);
      set({
        timeLeft: 0,
        phase: "round-complete",
        completedRounds: Math.max(state.completedRounds, state.round),
        medal: medalForRounds(Math.max(state.completedRounds, state.round)),
        lastRoundResult: result
      });
      return;
    }

    set({
      timeLeft: 0,
      phase: "game-over",
      medal: medalForRounds(state.completedRounds),
      lastRoundResult: createRoundResult({ ...state, timeLeft: 0 }, false)
    });
  },

  trySwap: async (from, to) => {
    const state = get();
    const config = getRoundConfig(state.round);
    if (state.phase !== "playing" || state.isResolving || !isAdjacent(from, to)) {
      return;
    }

    const swapped = swapTiles(state.board, from, to);
    set({ board: swapped, isResolving: true, combo: 0 });
    await wait(110);

    let matches = findMatches(swapped, config.boardSize);
    if (matches.length === 0) {
      set({
        board: swapTiles(swapped, from, to),
        isResolving: false,
        effects: [
          ...get().effects,
          {
            id: effectId("float"),
            type: "float",
            row: from.row,
            col: from.col,
            label: "Try another!",
            power: 1,
            createdAt: Date.now()
          }
        ]
      });
      return;
    }

    let board = swapped;
    let cascade = 0;
    let nextScore = state.roundScore;
    let nextTotal = state.totalScore;
    let match3Count = 0;
    let match5Count = 0;
    let maxCombo = state.bestCombo;
    const moveEffects: EmojiRushEffect[] = [];

    while (matches.length > 0 && cascade < 10) {
      cascade += 1;
      const stats = scoreMatches(matches);
      match3Count += stats.match3;
      match5Count += stats.match5;
      nextScore += stats.points;
      nextTotal += stats.points;
      maxCombo = Math.max(maxCombo, cascade);
      const marked = markMatches(board, matches);
      const burstCells = new Map<string, BoardPoint>();

      matches.forEach((match) => {
        match.cells.forEach((cell) => burstCells.set(`${cell.row}:${cell.col}`, cell));
      });
      burstCells.forEach((cell) => {
        moveEffects.push({
          id: effectId("pop"),
          type: "pop",
          row: cell.row,
          col: cell.col,
          label: match5Count > 0 ? "+3" : "+2",
          power: Math.min(5, cascade + 1),
          createdAt: Date.now()
        });
      });
      moveEffects.push({
        id: effectId("float"),
        type: "float",
        row: Math.max(0, from.row - 1),
        col: from.col,
        label: cascade > 1 ? `COMBO x${cascade}` : `+${stats.points}`,
        power: Math.min(5, cascade + stats.match5),
        createdAt: Date.now()
      });

      set({
        board: marked,
        roundScore: nextScore,
        roundMatch3Count: state.roundMatch3Count + match3Count,
        roundMatch5Count: state.roundMatch5Count + match5Count,
        totalScore: nextTotal,
        combo: cascade,
        bestCombo: maxCombo,
        effects: [...get().effects, ...moveEffects.splice(0, moveEffects.length)]
      });
      await wait(cascade > 1 ? 170 : 140);

      board = collapseBoard(marked, config);
      set({ board });
      await wait(190);

      board = clearNewFlags(board);
      if (!hasAvailableMove(board, config.boardSize) && findMatches(board, config.boardSize).length === 0) {
        board = createBoard(config);
        set({
          board,
          effects: [
            ...get().effects,
            {
              id: effectId("refresh"),
              type: "refresh",
              row: Math.floor(config.boardSize / 2),
              col: Math.floor(config.boardSize / 2),
              label: "Board refresh!",
              power: 4,
              createdAt: Date.now()
            }
          ]
        });
        await wait(220);
      } else {
        set({ board });
      }
      matches = findMatches(board, config.boardSize);
    }

    const movesLeft = Math.max(0, state.movesLeft - 1);
    const movesUsed = state.movesUsed + 1;
    const completed = nextScore >= config.targetPoints;
    const baseRoundResult = createRoundResult(
      {
        ...get(),
        roundScore: nextScore,
        roundMatch3Count: state.roundMatch3Count + match3Count,
        roundMatch5Count: state.roundMatch5Count + match5Count,
        movesUsed,
        bestCombo: maxCombo
      },
      completed
    );
    const roundResult = {
      ...baseRoundResult,
      maxCombo
    };

    if (completed) {
      const completedRounds = Math.max(state.completedRounds, state.round);
      set({
        isResolving: false,
        movesLeft,
        movesUsed,
        roundScore: nextScore,
        roundMatch3Count: state.roundMatch3Count + match3Count,
        roundMatch5Count: state.roundMatch5Count + match5Count,
        totalScore: nextTotal,
        phase: "round-complete",
        completedRounds,
        medal: medalForRounds(completedRounds),
        lastRoundResult: roundResult
      });
      return;
    }

    if (movesLeft <= 0) {
      set({
        isResolving: false,
        movesLeft,
        movesUsed,
        roundScore: nextScore,
        roundMatch3Count: state.roundMatch3Count + match3Count,
        roundMatch5Count: state.roundMatch5Count + match5Count,
        totalScore: nextTotal,
        phase: "game-over",
        medal: medalForRounds(state.completedRounds),
        lastRoundResult: { ...roundResult, completed: false }
      });
      return;
    }

    set({
      isResolving: false,
      movesLeft,
      movesUsed,
      roundScore: nextScore,
      roundMatch3Count: state.roundMatch3Count + match3Count,
      roundMatch5Count: state.roundMatch5Count + match5Count,
      totalScore: nextTotal,
      combo: 0,
      lastRoundResult: {
        ...roundResult,
        completed: false
      }
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

    const config = getRoundConfig(state.round + 1);
    set({
      ...setupRound(config),
      phase: "playing"
    });
  },

  repairRoundBoard: () => {
    const state = get();
    const config = getRoundConfig(state.round);
    const expectedTiles = config.boardSize * config.boardSize;
    const hasInvalidTiles = state.board.some(
      (tile) => tile.row < 0 || tile.col < 0 || tile.row >= config.boardSize || tile.col >= config.boardSize
    );

    if (state.phase === "playing" && (state.board.length !== expectedTiles || hasInvalidTiles)) {
      set({
        board: createBoard(config),
        isResolving: false,
        effects: [
          ...state.effects,
          {
            id: effectId("refresh"),
            type: "refresh",
            row: Math.floor(config.boardSize / 2),
            col: Math.floor(config.boardSize / 2),
            label: "Grid aligned!",
            power: 4,
            createdAt: Date.now()
          }
        ]
      });
    }
  },

  finishGame: () => {
    const state = get();
    set({
      phase: "game-over",
      isResolving: false,
      medal: medalForRounds(state.completedRounds)
    });
  },

  restartGame: () => {
    set({ ...initialRuntime });
  },

  clearEffects: () => {
    const now = Date.now();
    set((state) => ({
      effects: state.effects.filter((effect) => {
        return now - effect.createdAt < FX_TTL;
      })
    }));
  }
}));
