import type { MatchResult } from "./matches";

export type YakumanEvent = {
  date: string;
  createdAt: string;
  playerName: string;
  yakumanName: string;
  points: number | null;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export type ScoreRank = {
  date: string;
  createdAt: string;
  playerName: string;
  score: number;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export type SpreadRank = {
  date: string;
  createdAt: string;
  topPlayerName: string;
  lastPlayerName: string;
  spread: number;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export function computeSubtablesFromMatches(
  matches: MatchResult[],
  topN?: number,
  options?: { eligiblePlayers?: Set<string> }
): {
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
};

export function fetchStatsSubtables(
  start?: string,
  end?: string,
  topN?: number,
  options?: { minGames?: number }
): Promise<{
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
  error: string | null;
}>;

export default computeSubtablesFromMatches;
import type { MatchResult } from "./matches";

export type YakumanEvent = {
  date: string;
  createdAt: string;
  playerName: string;
  yakumanName: string;
  points: number | null;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export type ScoreRank = {
  date: string;
  createdAt: string;
  playerName: string;
  score: number;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export type SpreadRank = {
  date: string;
  createdAt: string;
  topPlayerName: string;
  lastPlayerName: string;
  spread: number;
  gameId?: number;
  gameType?: "3p" | "4p";
};

export function computeSubtablesFromMatches(matches: MatchResult[], topN?: number): {
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
};

export function fetchStatsSubtables(
  start?: string,
  end?: string,
  topN?: number
): Promise<{
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
  error: string | null;
}>;

export default computeSubtablesFromMatches;
