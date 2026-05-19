"use client";

import { create } from "zustand";

export type PlayerSide = "bat" | "bowl";
export type Batter = "player" | "ai";
export type GameStatus = "choose-side" | "playing" | "result";
export type MatchResult = "win" | "lose" | "draw";
export type MoveOutcome = "runs" | "out";

export type HandCricketMove = {
  id: number;
  innings: 1 | 2;
  batting: Batter;
  playerPick: number;
  aiPick: number;
  outcome: MoveOutcome;
  runs: number;
  message: string;
  intensity: "normal" | "four" | "six" | "out";
};

type HandCricketState = {
  status: GameStatus;
  selectedSide: PlayerSide | null;
  innings: 1 | 2;
  batting: Batter;
  playerScore: number;
  aiScore: number;
  ballsRemaining: number;
  target: number | null;
  timer: number;
  currentMove: HandCricketMove | null;
  result: MatchResult | null;
  isRevealing: boolean;
  message: string;
  moveIndex: number;
  chooseSide: (side: PlayerSide) => void;
  playMove: (playerPick: number) => void;
  tick: () => void;
  advanceAfterReveal: () => void;
  resetMatch: () => void;
};

export const MOVE_SECONDS = 3;
export const MAX_BALLS = 6;

const initialState = {
  status: "choose-side" as GameStatus,
  selectedSide: null,
  innings: 1 as const,
  batting: "player" as Batter,
  playerScore: 0,
  aiScore: 0,
  ballsRemaining: MAX_BALLS,
  target: null,
  timer: MOVE_SECONDS,
  currentMove: null,
  result: null,
  isRevealing: false,
  message: "Choose BAT or BOWL to enter the arena.",
  moveIndex: 0
};

function randomPick() {
  return Math.floor(Math.random() * 6) + 1;
}

function normalizePick(value: number) {
  return Math.min(6, Math.max(1, Math.round(value)));
}

function resultFor(playerScore: number, aiScore: number): MatchResult {
  if (playerScore > aiScore) {
    return "win";
  }

  if (aiScore > playerScore) {
    return "lose";
  }

  return "draw";
}

function moveIntensity(outcome: MoveOutcome, runs: number): HandCricketMove["intensity"] {
  if (outcome === "out") {
    return "out";
  }

  if (runs === 6) {
    return "six";
  }

  if (runs === 4) {
    return "four";
  }

  return "normal";
}

function battingLabel(batting: Batter) {
  return batting === "player" ? "You" : "AI";
}

export const useHandCricketStore = create<HandCricketState>((set, get) => ({
  ...initialState,

  chooseSide: (side) => {
    const batting: Batter = side === "bat" ? "player" : "ai";
    set({
      ...initialState,
      status: "playing",
      selectedSide: side,
      batting,
      message: batting === "player" ? "You are batting first." : "AI is batting first. Match the number to bowl it out."
    });
  },

  playMove: (playerPick) => {
    const state = get();
    if (state.status !== "playing" || state.isRevealing) {
      return;
    }

    const nextPlayerPick = normalizePick(playerPick);
    const aiPick = randomPick();
    const outcome: MoveOutcome = nextPlayerPick === aiPick ? "out" : "runs";
    const runs = outcome === "out" ? 0 : state.batting === "player" ? nextPlayerPick : aiPick;
    const playerScore = state.playerScore + (state.batting === "player" ? runs : 0);
    const aiScore = state.aiScore + (state.batting === "ai" ? runs : 0);
    const ballsRemaining = Math.max(0, state.ballsRemaining - 1);
    const moveIndex = state.moveIndex + 1;
    const message =
      outcome === "out"
        ? `${battingLabel(state.batting)} got OUT`
        : `${battingLabel(state.batting)} hit ${runs} run${runs === 1 ? "" : "s"}`;

    set({
      playerScore,
      aiScore,
      ballsRemaining,
      timer: 0,
      isRevealing: true,
      moveIndex,
      message,
      currentMove: {
        id: moveIndex,
        innings: state.innings,
        batting: state.batting,
        playerPick: nextPlayerPick,
        aiPick,
        outcome,
        runs,
        message,
        intensity: moveIntensity(outcome, runs)
      }
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== "playing" || state.isRevealing) {
      return;
    }

    if (state.timer <= 1) {
      state.playMove(randomPick());
      return;
    }

    set({ timer: state.timer - 1 });
  },

  advanceAfterReveal: () => {
    const state = get();
    if (state.status !== "playing" || !state.isRevealing || !state.currentMove) {
      return;
    }

    const inningsComplete = state.currentMove.outcome === "out" || state.ballsRemaining <= 0;
    const playerChased = state.innings === 2 && state.target !== null && state.batting === "player" && state.playerScore >= state.target;
    const aiChased = state.innings === 2 && state.target !== null && state.batting === "ai" && state.aiScore >= state.target;
    const targetReached = playerChased || aiChased;

    if (state.innings === 1 && inningsComplete) {
      const firstInningsScore = state.batting === "player" ? state.playerScore : state.aiScore;
      const nextBatting: Batter = state.batting === "player" ? "ai" : "player";
      set({
        innings: 2,
        batting: nextBatting,
        ballsRemaining: MAX_BALLS,
        target: firstInningsScore + 1,
        timer: MOVE_SECONDS,
        isRevealing: false,
        message:
          nextBatting === "player"
            ? `Chase ${firstInningsScore + 1} to win.`
            : `Defend ${firstInningsScore + 1}. Match the AI to bowl it out.`
      });
      return;
    }

    if (state.innings === 2 && (inningsComplete || targetReached)) {
      set({
        status: "result",
        result: resultFor(state.playerScore, state.aiScore),
        timer: 0,
        isRevealing: false,
        message: "Match complete."
      });
      return;
    }

    set({
      timer: MOVE_SECONDS,
      isRevealing: false,
      message: state.batting === "player" ? "Pick your batting number." : "Pick your bowling number."
    });
  },

  resetMatch: () => {
    set({ ...initialState });
  }
}));
