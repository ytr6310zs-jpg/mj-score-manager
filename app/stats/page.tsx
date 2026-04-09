import type { Metadata } from "next";
import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import CsvExportButton from "@/components/csv-export-button";
import DateRangeFilter from "@/components/date-range-filter";
import { FlashMessage } from "@/components/flash-message";
import { fetchPlayerStats } from "@/lib/stats";
import StatsSortableTable from "@/components/stats-sortable-table";
import type { PlayerStats } from "@/lib/stats";
import { computeTopSets, METRICS_TO_HIGHLIGHT, METRIC_DIRECTION } from "@/lib/metric-ranks";
import { RANK_BADGE, RANK_ROW_BG } from "@/lib/stats-rank-theme";
import { fetchStatsSubtables } from "@/lib/stats-subtables";
import { fetchMatchDates } from "@/lib/matches";
import { resolveFilterParams } from "@/lib/filter-params";

type RankSets = { first: string[]; second: string[]; third: string[] };

function renderMedalBadge(topSets: Record<string, RankSets>, metric: string, playerName: string) {
  const sets = topSets[metric];
  if (!sets) return null;
  if (sets.first?.includes(playerName))
    return (
      <span className={`ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${RANK_BADGE[1]} text-[10px] font-bold`}>
        1
      </span>
    );
  if (sets.second?.includes(playerName))
    return (
      <span className={`ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${RANK_BADGE[2]} text-[10px] font-bold`}>
        2
      </span>
    );
  if (sets.third?.includes(playerName))
    return (
      <span className={`ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${RANK_BADGE[3]} text-[10px] font-bold`}>
        3
      </span>
    );
  return null;
}

export const metadata: Metadata = {
  title: "成績集計 | 麻雀成績入力",
  description: "プレイヤーごとの累計成績を表示します",
};

export const dynamic = "force-dynamic";

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function score(value: number): string {
  return String(value);
}

// rank styles are provided by lib/stats-rank-theme

type SearchParams = { [key: string]: string | string[] | undefined } | undefined;

export default async function StatsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await (searchParams as Promise<SearchParams> | undefined);

  const { filter, start, end, minGames } = resolveFilterParams({
    filterRaw: params?.filter,
    modeRaw: params?.mode,
    startRaw: params?.start,
    endRaw: params?.end,
    minGamesRaw: params?.minGames,
  });

  const { dates: availableDates, error: datesError } = await fetchMatchDates();
  const { stats, error } = await fetchPlayerStats(start, end, minGames);
  const topSets = computeTopSets(stats, METRICS_TO_HIGHLIGHT, METRIC_DIRECTION);
  const { yakumanEvents, highestScores, lowestScores, largestSpreads } = await fetchStatsSubtables(
    start,
    end,
    5
  );

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <Suspense>
        <FlashMessage />
      </Suspense>
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="stats" />

        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">成績集計</h1>
            <p className="mt-1 text-xs text-emerald-700/70 md:hidden">※ 集計対象：記録済みの全対局</p>
            <p className="mt-1 text-xs text-emerald-700/70 hidden md:block">
              ※ 集計対象：記録済みの全対局。PC など横幅のある端末では表の列ヘッダーをクリックして任意の指標で並び替え（ソート）ができます。クリックごとに降順/昇順が切り替わり、アクティブな列は▲/▼で示されます。
            </p>
          </div>

          <div className="p-4">
            {/* client-side date filter that sets start/end when '当日' is checked */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <DateRangeFilter
                  initialFilter={filter}
                  initialStart={start}
                  initialEnd={end}
                  initialMinGames={typeof minGames === "number" ? String(minGames) : undefined}
                  actionPath="/stats"
                  availableDates={datesError ? undefined : availableDates}
                />
              </div>
            </div>
            {error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : stats.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                まだ対局データがありません。スコアを入力してください。
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {stats.map((player) => {
                    const rowBg = RANK_ROW_BG[player.rank] ?? "bg-white/60";
                    const badgeCls = RANK_BADGE[player.rank] ?? "bg-transparent text-foreground";

                    return (
                      <article key={player.name} className={`rounded-lg border border-emerald-100 p-4 shadow-sm ${rowBg}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-emerald-950">{player.name}</p>
                            <p className="text-xs text-emerald-800/80">対局数 {player.games} / 合計 {score(player.totalScore)}</p>
                          </div>
                          <span
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-bold ${badgeCls}`}
                          >
                            {player.rank}
                          </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-emerald-900/85">
                          <div>
                            <dt className="font-semibold">トップ</dt>
                            <dd>
                              {player.topCount}
                              {renderMedalBadge(topSets, "topCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">ラス</dt>
                            <dd>
                              {player.lastCount}
                              {renderMedalBadge(topSets, "lastCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">トップ率</dt>
                            <dd>
                              {pct(player.topRate)}
                              {renderMedalBadge(topSets, "topRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">2位率</dt>
                            <dd>
                              {pct(player.secondRate)}
                              {renderMedalBadge(topSets, "secondRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">3位率</dt>
                            <dd>
                              {pct(player.thirdRate)}
                              {renderMedalBadge(topSets, "thirdRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">ラス回避</dt>
                            <dd>
                              {pct(player.lastAvoidanceRate)}
                              {renderMedalBadge(topSets, "lastAvoidanceRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛ばし</dt>
                            <dd>
                              {player.tobashiCount}
                              {renderMedalBadge(topSets, "tobashiCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛び</dt>
                            <dd>
                              {player.tobiCount}
                              {renderMedalBadge(topSets, "tobiCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">焼き鳥</dt>
                            <dd>
                              {player.yakitoriCount}
                              {renderMedalBadge(topSets, "yakitoriCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">役満</dt>
                            <dd>
                              {player.yakumanCount}
                              {renderMedalBadge(topSets, "yakumanCount", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">接待率</dt>
                            <dd>
                              {pct(player.setaiRate)}
                              {renderMedalBadge(topSets, "setaiRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛ばし率</dt>
                            <dd>
                              {pct(player.tobashiRate)}
                              {renderMedalBadge(topSets, "tobashiRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛び回避率</dt>
                            <dd>
                              {pct(player.tobiAvoidanceRate)}
                              {renderMedalBadge(topSets, "tobiAvoidanceRate", player.name)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold">焼き鳥回避率</dt>
                            <dd>
                              {pct(player.yakitoriAvoidanceRate)}
                              {renderMedalBadge(topSets, "yakitoriAvoidanceRate", player.name)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  {/* PC: sortable table component */}
                  <StatsSortableTable stats={stats} topSets={topSets} />
                </div>
              </>
            )}

            {/* CSV 出力（表の下部右寄せ） */}
            <div className="flex justify-end mt-3">
              <CsvExportButton
                apiPath="/api/export/stats"
                className="rounded bg-emerald-600 px-3 text-sm text-white h-10 flex items-center justify-center"
              >
                CSV 出力
              </CsvExportButton>
            </div>

          </div>
        </div>

        {/* --- 追加: 別表 (役満一覧 / 1対局ランキング) --- */}
        <div className="rounded-xl border border-white/70 bg-white/90 px-5 py-4 text-sm text-emerald-900/85 shadow backdrop-blur">
          <h2 className="font-semibold">追加の統計（別表）</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <section className="rounded border p-3">
              <h3 className="font-medium">役満リスト（最新 {yakumanEvents.length}件）</h3>
              {yakumanEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-emerald-800">
                        <th className="px-2 py-1 text-left">日付</th>
                        <th className="px-2 py-1 text-left">プレイヤー</th>
                        <th className="px-2 py-1 text-left">役</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yakumanEvents.map((y, i) => (
                        <tr key={`${y.gameId}-${i}`} className="border-t">
                          <td className="px-2 py-1">{y.date}</td>
                          <td className="px-2 py-1">{y.playerName}</td>
                          <td className="px-2 py-1">{y.yakumanName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded border p-3">
              <h3 className="font-medium">最高得点ランキング（最新 {highestScores.length}件）</h3>
              {highestScores.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-emerald-800">
                        <th className="px-2 py-1 text-left">日付</th>
                        <th className="px-2 py-1 text-left">プレイヤー</th>
                        <th className="px-2 py-1 text-right">点数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highestScores.map((r, i) => (
                        <tr key={`${r.gameId}-${i}`} className="border-t">
                          <td className="px-2 py-1">{r.date}</td>
                          <td className="px-2 py-1">{r.playerName}</td>
                          <td className="px-2 py-1 text-right">{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="rounded border p-3">
              <h3 className="font-medium">最低得点ランキング（最新 {lowestScores.length}件）</h3>
              {lowestScores.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-emerald-800">
                        <th className="px-2 py-1 text-left">日付</th>
                        <th className="px-2 py-1 text-left">プレイヤー</th>
                        <th className="px-2 py-1 text-right">点数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowestScores.map((r, i) => (
                        <tr key={`${r.gameId}-${i}`} className="border-t">
                          <td className="px-2 py-1">{r.date}</td>
                          <td className="px-2 py-1">{r.playerName}</td>
                          <td className="px-2 py-1 text-right">{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded border p-3">
              <h3 className="font-medium">最大点差ランキング（最新 {largestSpreads.length}件）</h3>
              {largestSpreads.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-emerald-800">
                        <th className="px-2 py-1 text-left">日付</th>
                        <th className="px-2 py-1 text-left">上位</th>
                        <th className="px-2 py-1 text-left">下位</th>
                        <th className="px-2 py-1 text-right">差</th>
                      </tr>
                    </thead>
                    <tbody>
                      {largestSpreads.map((s, i) => (
                        <tr key={`${s.gameId}-${i}`} className="border-t">
                          <td className="px-2 py-1">{s.date}</td>
                          <td className="px-2 py-1">{s.topPlayerName}</td>
                          <td className="px-2 py-1">{s.lastPlayerName}</td>
                          <td className="px-2 py-1 text-right">{s.spread}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="rounded-xl border border-white/70 bg-white/80 px-5 py-4 text-xs text-emerald-900/70 shadow backdrop-blur">
          <p className="font-semibold">各指標の計算式</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            <li>トップ率 ＝ トップ回数 ÷ 対局数</li>
            <li>ラス回避 ＝ 1 − ラス回数 ÷ 対局数</li>
            <li>飛ばし率 ＝ 飛ばし回数 ÷ 対局数</li>
            <li>飛び回避率 ＝ 1 − 飛び回数 ÷ 対局数</li>
            <li>焼き鳥回避率 ＝ 1 − 焼き鳥回数 ÷ 対局数</li>
            <li>接待率 ＝（対局数 − トップ − ラス）÷ 対局数</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
