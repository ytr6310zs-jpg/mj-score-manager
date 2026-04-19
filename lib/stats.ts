import type { MatchQueryOptions } from "./matches";
import { fetchMatchResults } from "./matches";
import { sortAndAssignCompetitionRank } from "./stats-ranking";

export type PlayerStats = {
  name: string;
  rank: number;
  totalScore: number;
  games: number;
  topCount: number;
  lastCount: number;
  tobashiCount: number;
  tobiCount: number;
  yakitoriCount: number;
  yakumanCount: number;
  topRate: number;
  lastAvoidanceRate: number;
  tobashiRate: number;
  tobiAvoidanceRate: number;
  yakitoriAvoidanceRate: number;
  secondRate: number;
  thirdRate: number;
  /** 接待率 = (対局数 - トップ回数 - ラス回数) / 対局数 */
  setaiRate: number;
};

type PlayerAccumulator = {
  totalScore: number;
  games: number;
  topCount: number;
  lastCount: number;
  tobashiCount: number;
  tobiCount: number;
  yakitoriCount: number;
  yakumanCount: number;
  secondCount: number;
  thirdCount: number;
};

// Removed unused helpers `toBool` and `toInt` to clean ESLint warnings.

export async function fetchPlayerStats(
  startDate?: string,
  endDate?: string,
  minGames?: number,
  options: MatchQueryOptions = {}
): Promise<{
  stats: PlayerStats[];
  error: string | null;
}> {
  try {
    const { matches, error } = await fetchMatchResults(startDate, endDate, options);
    if (error) return { stats: [], error };

    const playerMap = new Map<string, PlayerAccumulator>();

    for (const match of matches) {
      const playerCount = match.playerCount || 3;
      for (const p of match.players) {
        const playerName = p.name.trim();
        if (!playerName) continue;

        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, {
            totalScore: 0,
            games: 0,
            topCount: 0,
            lastCount: 0,
            tobashiCount: 0,
            tobiCount: 0,
            yakitoriCount: 0,
            yakumanCount: 0,
            secondCount: 0,
            thirdCount: 0,
          });
        }

        const acc = playerMap.get(playerName)!;
        acc.totalScore += p.score;
        acc.games += 1;
        if (p.rank === 1) acc.topCount += 1;
        if (p.rank === playerCount) acc.lastCount += 1;
        if (p.rank === 2) acc.secondCount += 1;
        if (p.rank === 3) acc.thirdCount += 1;
        if (p.isTobashi) acc.tobashiCount += 1;
        if (p.isTobi) acc.tobiCount += 1;
        if (p.isYakitori) acc.yakitoriCount += 1;
        acc.yakumanCount += p.yakumans?.length ?? 0;
      }
    }

    const rows = Array.from(playerMap.entries())
      .filter(([, s]) => s.games > 0)
      .map(([name, s]) => ({ name, ...s }));

    const filteredRows = typeof minGames === "number" ? rows.filter((row) => row.games >= minGames) : rows;
    const rankedRows = sortAndAssignCompetitionRank(filteredRows);

    const stats: PlayerStats[] = rankedRows.map((s) => {
      const { games } = s;
      const middleCount = games - s.topCount - s.lastCount;

      return {
        name: s.name,
        rank: s.rank,
        totalScore: s.totalScore,
        games,
        topCount: s.topCount,
        lastCount: s.lastCount,
        tobashiCount: s.tobashiCount,
        tobiCount: s.tobiCount,
        yakitoriCount: s.yakitoriCount,
        yakumanCount: s.yakumanCount,
        topRate: games > 0 ? s.topCount / games : 0,
        secondRate: games > 0 ? s.secondCount / games : 0,
        thirdRate: games > 0 ? s.thirdCount / games : 0,
        lastAvoidanceRate: games > 0 ? 1 - s.lastCount / games : 0,
        tobashiRate: games > 0 ? s.tobashiCount / games : 0,
        tobiAvoidanceRate: games > 0 ? 1 - s.tobiCount / games : 0,
        yakitoriAvoidanceRate: games > 0 ? 1 - s.yakitoriCount / games : 0,
        setaiRate: games > 0 ? middleCount / games : 0,
      };
    });

    return { stats, error: null };
  } catch {
    return {
      stats: [],
      error: "データの取得に失敗しました。",
    };
  }
}
