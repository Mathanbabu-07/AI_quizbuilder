"use client";

import { create } from "zustand";

export type PlayerSide = "bat" | "bowl";
export type Batter = "player" | "ai";
export type GameStatus = "choose-side" | "playing" | "innings-break" | "result";
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

export type InningsBreak = {
  score: number;
  target: number;
  nextBatting: Batter;
  title: string;
  message: string;
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
  pendingPlayerPick: number | null;
  currentMove: HandCricketMove | null;
  inningsBreak: InningsBreak | null;
  result: MatchResult | null;
  isRevealing: boolean;
  message: string;
  moveIndex: number;
  chooseSide: (side: PlayerSide) => void;
  playMove: (playerPick: number) => void;
  revealMove: () => void;
  tick: () => void;
  advanceAfterReveal: () => void;
  startNextInnings: () => void;
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
  pendingPlayerPick: null,
  currentMove: null,
  inningsBreak: null,
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
      message: batting === "player" ? "Pick your batting number." : "Pick your bowling number."
    });
  },

  playMove: (playerPick) => {
    const state = get();
    if (state.status !== "playing" || state.isRevealing || state.pendingPlayerPick !== null) {
      return;
    }

    const nextPlayerPick = normalizePick(playerPick);
    set({
      pendingPlayerPick: nextPlayerPick,
      message: `Number ${nextPlayerPick} locked. Reveal in ${state.timer}.`
    });
  },

  revealMove: () => {
    const state = get();
    if (state.status !== "playing" || state.isRevealing) {
      return;
    }

    const nextPlayerPick = state.pendingPlayerPick ?? randomPick();
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
      pendingPlayerPick: null,
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
      state.revealMove();
      return;
    }

    const nextTimer = state.timer - 1;
    set({
      timer: nextTimer,
      message:
        state.pendingPlayerPick === null
          ? state.batting === "player"
            ? "Pick your batting number."
            : "Pick your bowling number."
          : `Number ${state.pendingPlayerPick} locked. Reveal in ${nextTimer}.`
    });
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
        status: "innings-break",
        inningsBreak: {
          score: firstInningsScore,
          target: firstInningsScore + 1,
          nextBatting,
          title: state.batting === "player" ? "INNINGS COMPLETE" : "CHASE READY",
          message:
            nextBatting === "player"
              ? `AI scored ${firstInningsScore}. Chase ${firstInningsScore + 1} runs to win.`
              : `You scored ${firstInningsScore}. Defend ${firstInningsScore + 1} runs now.`
        },
        isRevealing: false,
        message: "Next innings starting."
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
      currentMove: null,
      isRevealing: false,
      message: state.batting === "player" ? "Pick your batting number." : "Pick your bowling number."
    });
  },

  startNextInnings: () => {
    const state = get();
    if (state.status !== "innings-break" || !state.inningsBreak) {
      return;
    }

    set({
      status: "playing",
      innings: 2,
      batting: state.inningsBreak.nextBatting,
      ballsRemaining: MAX_BALLS,
      target: state.inningsBreak.target,
      timer: MOVE_SECONDS,
      pendingPlayerPick: null,
      currentMove: null,
      inningsBreak: null,
      isRevealing: false,
      message: state.inningsBreak.nextBatting === "player" ? "Pick your batting number." : "Pick your bowling number."
    });
  },

  resetMatch: () => {
    set({ ...initialState });
  }
}));
