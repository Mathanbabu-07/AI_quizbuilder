import type { MatchResult } from "@/app/games/hand-cricket/store/handCricketStore";

export function resultLabel(result: MatchResult) {
  if (result === "win") {
    return "player";
  }

  if (result === "lose") {
    return "ai";
  }

  return "draw";
}
