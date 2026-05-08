import type { MatchResult } from "./matches";

export type MatchupRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type CompatibilityResult = {
  players: string[];
  matrix: Map<string, Map<string, MatchupRecord>>;
};

export declare function computeWinRate(record: MatchupRecord): number;
export declare function buildCompatibilityMatrix(matches: MatchResult[]): CompatibilityResult;
