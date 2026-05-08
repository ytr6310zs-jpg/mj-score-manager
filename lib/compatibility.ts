import { buildCompatibilityMatrix, computeWinRate, filterCompatibilityByMinGames } from "./compatibility-matrix.js";
import type { MatchQueryOptions } from "./matches";
import { fetchMatchResults } from "./matches";

export type MatchupRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type CompatibilityResult = {
  /** ソート済み全プレーヤーリスト */
  players: string[];
  /** matrix[rowPlayer][colPlayer] = MatchupRecord（行プレーヤーから見た戦績）*/
  matrix: Map<string, Map<string, MatchupRecord>>;
};

export { buildCompatibilityMatrix, computeWinRate };

type CompatibilityOptions = MatchQueryOptions & { minGames?: number };

/** Supabase からゲームデータを取得し、相性マトリクスを算出する */
export async function fetchCompatibilityMatrix(
  startDate?: string,
  endDate?: string,
  options: CompatibilityOptions = {},
): Promise<{ result: CompatibilityResult | null; error: string | null }> {
  const { minGames, ...matchOptions } = options;
  const { matches, error } = await fetchMatchResults(startDate, endDate, matchOptions);
  if (error) {
    return { result: null, error };
  }
  const raw = buildCompatibilityMatrix(matches);

  if (minGames && minGames > 0) {
    const filtered = filterCompatibilityByMinGames(raw, matches, minGames);
    return { result: filtered, error: null };
  }

  return { result: raw, error: null };
}
