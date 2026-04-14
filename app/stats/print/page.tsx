import { resolveFilterParams } from "@/lib/filter-params";
import { fetchMatchResults } from "@/lib/matches";
import { fetchPlayerStats } from "@/lib/stats";
import { fetchStatsSubtables } from "@/lib/stats-subtables";



import ClientStatsPrintPage from "./client";

type PrintSearchParams = { [key: string]: string | string[] | undefined } | undefined;

function buildQueryString(params: PrintSearchParams) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  }
  return searchParams.toString();
}

export default async function StatsPrintPage({ searchParams }: { searchParams?: Promise<PrintSearchParams> }) {
  // クエリ取得
  const params = await (searchParams as Promise<PrintSearchParams> | undefined);
  const { filter, start, end, minGames } = resolveFilterParams({
    filterRaw: params?.filter,
    modeRaw: params?.mode,
    startRaw: params?.start,
    endRaw: params?.end,
    minGamesRaw: params?.minGames,
  });
  // データ取得
  const { stats } = await fetchPlayerStats(start, end, minGames);
  const { yakumanEvents, highestScores, lowestScores, largestSpreads } = await fetchStatsSubtables(
    start,
    end,
    5,
    { minGames }
  );
  const { matches } = await fetchMatchResults(start, end);

  // 追加: 今年かつ20試合以上の参考データ
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const { stats: statsYearly } = await fetchPlayerStats(yearStart, yearEnd, 20);
  const {
    yakumanEvents: yakumanEventsYearly,
    highestScores: highestScoresYearly,
    lowestScores: lowestScoresYearly,
    largestSpreads: largestSpreadsYearly,
  } = await fetchStatsSubtables(yearStart, yearEnd, 5, { minGames: 20 });

  // ヘッダー用文言生成
  let periodLabel = "";
  if (filter === "year" && start && end) {
    periodLabel = `対象期間: ${start} 〜 ${end}`;
  } else if (filter && /^\d{4}-\d{2}-\d{2}$/.test(filter)) {
    periodLabel = `対象期間: ${filter}（開催日）`;
  } else if (filter === "custom" && start && end) {
    periodLabel = `対象期間: ${start} 〜 ${end}`;
  }
  let minGamesLabel = "試合数条件: 条件なし";
  if (minGames === 20) minGamesLabel = "試合数条件: 20試合以上";

  const queryString = buildQueryString(params);
  const returnUrl = `/stats${queryString ? `?${queryString}` : ""}`;

  return (
    <ClientStatsPrintPage
      stats={stats}
      yakumanEvents={yakumanEvents}
      highestScores={highestScores}
      lowestScores={lowestScores}
      largestSpreads={largestSpreads}
      matches={matches}
      // yearly reference
      statsYearly={statsYearly}
      yakumanEventsYearly={yakumanEventsYearly}
      highestScoresYearly={highestScoresYearly}
      lowestScoresYearly={lowestScoresYearly}
      largestSpreadsYearly={largestSpreadsYearly}
      periodLabel={periodLabel}
      minGamesLabel={minGamesLabel}
      returnUrl={returnUrl}
    />
  );
}