import type { Metadata } from "next";
import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import DateRangeFilter from "@/components/date-range-filter";
import { FlashMessage } from "@/components/flash-message";
import { resolveFilterParams } from "@/lib/filter-params";
import { fetchCompatibilityMatrix, computeWinRate, type MatchupRecord } from "@/lib/compatibility";
import { fetchMatchDates } from "@/lib/matches";
import { getCurrentSession } from "@/lib/session";
import { RANK_ROW_BG } from "@/lib/stats-rank-theme";
import { fetchTournamentOptions } from "@/lib/tournaments";

export const metadata: Metadata = {
  title: "相性表 | 麻雀成績入力",
  description: "プレーヤー間の対戦戦績（勝・負・分け・勝率）をマトリクス形式で表示します",
};

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined } | undefined;
type WinRateRank = 1 | 2 | 3;

function renderCellText(record: MatchupRecord | undefined): string | null {
  if (!record) return null;
  const { wins, losses, draws } = record;
  if (wins === 0 && losses === 0 && draws === 0) return null;
  const drawPart = draws > 0 ? `${draws}分け` : "";
  const wr = computeWinRate(record);
  return `${wins}勝${losses}敗${drawPart}\n${wr.toFixed(1)}%`;
}

function buildTopWinRateRanksByRow(
  players: string[],
  matrix: Map<string, Map<string, MatchupRecord>> | undefined
): Map<string, Map<string, WinRateRank>> {
  const ranksByRow = new Map<string, Map<string, WinRateRank>>();

  for (const row of players) {
    const rowRecords = matrix?.get(row);
    const candidates = players
      .filter((col) => col !== row)
      .flatMap((col) => {
        const record = rowRecords?.get(col);
        if (!record) return [];
        if (record.wins === 0 && record.losses === 0 && record.draws === 0) return [];
        return [{ col, winRate: Number(computeWinRate(record).toFixed(1)) }];
      })
      .sort((a, b) => b.winRate - a.winRate || a.col.localeCompare(b.col));

    const rowRanks = new Map<string, WinRateRank>();
    let currentRank = 0;
    let prevWinRate: number | null = null;

    for (const candidate of candidates) {
      if (prevWinRate === null || candidate.winRate !== prevWinRate) {
        currentRank += 1;
        prevWinRate = candidate.winRate;
      }
      if (currentRank > 3) break;
      rowRanks.set(candidate.col, currentRank as WinRateRank);
    }

    ranksByRow.set(row, rowRanks);
  }

  return ranksByRow;
}

export default async function CompatibilityPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const session = await getCurrentSession();
  const params = await (searchParams as Promise<SearchParams> | undefined);

  const { filter, start, end, tournamentId } = resolveFilterParams({
    filterRaw: params?.filter,
    modeRaw: params?.mode,
    startRaw: params?.start,
    endRaw: params?.end,
    tournamentIdRaw: params?.tournamentId,
  });

  const [tournaments, { dates: availableDates, error: datesError }, { result, error }] =
    await Promise.all([
      fetchTournamentOptions(),
      fetchMatchDates({ tournamentId }),
      fetchCompatibilityMatrix(start, end, { tournamentId }),
    ]);

  const players = result?.players ?? [];
  const matrix = result?.matrix;
  const topWinRateRanksByRow = buildTopWinRateRanksByRow(players, matrix);

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <Suspense>
        <FlashMessage />
      </Suspense>
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader
          current="compatibility"
          sessionUser={session ? { displayName: session.displayName, role: session.role } : undefined}
        />

        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">相性表</h1>
            <p className="mt-1 text-xs text-emerald-700/70">
              行プレーヤーから見た対戦戦績を表示します。勝率 = 勝数 ÷ (勝数 + 敗数) × 100
            </p>
            <p className="mt-1 text-xs text-emerald-700/70">
              各行の上位3勝率（同率同順位）は成績集計と同じ配色で背景表示されます。
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <DateRangeFilter
                  initialFilter={filter}
                  initialStart={start}
                  initialEnd={end}
                  initialTournamentId={tournamentId ? String(tournamentId) : undefined}
                  showMinGames={false}
                  actionPath="/compatibility"
                  availableDates={datesError ? undefined : availableDates}
                  tournaments={tournaments}
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-6">
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : players.length === 0 ? (
              <p className="text-sm text-emerald-700/70">該当期間のデータがありません。</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50">
                <div className="max-h-[70vh] overflow-auto bg-white">
                  <table className="min-w-full border-separate border-spacing-0 text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 border-b border-r border-emerald-200 bg-emerald-100 px-3 py-2 text-center font-semibold text-emerald-900 whitespace-nowrap">
                        ↓行 vs 列→
                      </th>
                      {players.map((col) => (
                        <th
                          key={col}
                          className="sticky top-0 z-20 border-b border-r border-emerald-200 bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-900 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((row) => (
                      <tr key={row}>
                        <th className="sticky left-0 z-10 border-b border-r border-emerald-200 bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-900 whitespace-nowrap">
                          {row}
                        </th>
                        {players.map((col) => {
                          if (row === col) {
                            return (
                              <td
                                key={col}
                                className="border-b border-r border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-400"
                              >
                                -
                              </td>
                            );
                          }
                          const record = matrix?.get(row)?.get(col);
                          const cellText = renderCellText(record);
                          const winRateRank = topWinRateRanksByRow.get(row)?.get(col);
                          const bgClass = winRateRank ? RANK_ROW_BG[winRateRank] : "bg-white";
                          if (!cellText) {
                            return (
                              <td
                                key={col}
                                className="border-b border-r border-emerald-200 bg-white px-3 py-2 text-center text-emerald-400"
                              >
                                -
                              </td>
                            );
                          }
                          const [wld, wr] = cellText.split("\n");
                          return (
                            <td
                              key={col}
                              className={`border-b border-r border-emerald-200 px-3 py-2 text-center ${bgClass}`}
                            >
                              <div className="whitespace-nowrap font-medium text-emerald-900">{wld}</div>
                              <div className="whitespace-nowrap text-emerald-600">{wr}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
