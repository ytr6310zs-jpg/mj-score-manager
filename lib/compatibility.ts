import type { MatchQueryOptions } from "./matches";
import { fetchMatchResults } from "./matches";
import { buildCompatibilityMatrix, computeWinRate } from "./compatibility-matrix.js";

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

/** Supabase からゲームデータを取得し、相性マトリクスを算出する */
export async function fetchCompatibilityMatrix(
  startDate?: string,
  endDate?: string,
  options: MatchQueryOptions = {},
): Promise<{ result: CompatibilityResult | null; error: string | null }> {
  const { matches, error } = await fetchMatchResults(startDate, endDate, options);
  if (error) {
    return { result: null, error };
  }
  const result = buildCompatibilityMatrix(matches);
  return { result, error: null };
}
