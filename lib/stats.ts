import { fetchMatchResults } from "./matches";

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
  topRate: number;
  lastAvoidanceRate: number;
  tobashiRate: number;
  tobiAvoidanceRate: number;
  yakitoriAvoidanceRate: number;
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
};

// Removed unused helpers `toBool` and `toInt` to clean ESLint warnings.

export async function fetchPlayerStats(startDate?: string, endDate?: string): Promise<{
  stats: PlayerStats[];
  error: string | null;
}> {
  try {
    const { matches, error } = await fetchMatchResults(startDate, endDate);
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
          });
        }

        const acc = playerMap.get(playerName)!;
        acc.totalScore += p.score;
        acc.games += 1;
        if (p.rank === 1) acc.topCount += 1;
        if (p.rank === playerCount) acc.lastCount += 1;
        if (p.isTobashi) acc.tobashiCount += 1;
        if (p.isTobi) acc.tobiCount += 1;
        if (p.isYakitori) acc.yakitoriCount += 1;
      }
    }

    const sorted = Array.from(playerMap.entries())
      .filter(([, s]) => s.games > 0)
      .sort(([, a], [, b]) => b.totalScore - a.totalScore);

    const stats: PlayerStats[] = sorted.map(([name, s], index) => {
      const { games } = s;
      const middleCount = games - s.topCount - s.lastCount;

      return {
        name,
        rank: index + 1,
        totalScore: s.totalScore,
        games,
        topCount: s.topCount,
        lastCount: s.lastCount,
        tobashiCount: s.tobashiCount,
        tobiCount: s.tobiCount,
        yakitoriCount: s.yakitoriCount,
        topRate: games > 0 ? s.topCount / games : 0,
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
