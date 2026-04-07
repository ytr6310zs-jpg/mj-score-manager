import type { Metadata } from "next";
import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import CsvExportButton from "@/components/csv-export-button";
import DateRangeFilter from "@/components/date-range-filter";
import { FlashMessage } from "@/components/flash-message";
import { fetchPlayerStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "個人成績集計 | 麻雀成績入力",
  description: "プレイヤーごとの累計成績を表示します",
};

export const dynamic = "force-dynamic";

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function score(value: number): string {
  return String(value);
}

const RANK_ROW_BG: Record<number, string> = {
  1: "bg-yellow-50",
  2: "bg-slate-50",
  3: "bg-orange-50/60",
};

const RANK_BADGE: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-slate-300 text-slate-800",
  3: "bg-amber-400/70 text-amber-900",
};

type SearchParams = { [key: string]: string | string[] | undefined } | undefined;

export default async function StatsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await (searchParams as Promise<SearchParams> | undefined);
  const modeRaw = params?.mode;
  const startRaw = params?.start;
  const endRaw = params?.end;
  const todayParam = params?.today;
  const thisYearParam = params?.thisYear;

  const todayStr = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  let mode: "today" | "thisYear" | "range" = "thisYear";
  if (modeRaw) {
    mode = Array.isArray(modeRaw) ? (modeRaw[0] as "today" | "thisYear" | "range") : (modeRaw as "today" | "thisYear" | "range");
  } else if (todayParam !== undefined) {
    mode = "today";
  } else if (thisYearParam !== undefined) {
    mode = "thisYear";
  } else if (startRaw !== undefined || endRaw !== undefined) {
    mode = "range";
  }

  const start =
    mode === "today" ? todayStr : mode === "thisYear" ? yearStart : Array.isArray(startRaw) ? startRaw[0] : startRaw;
  const end =
    mode === "today" ? todayStr : mode === "thisYear" ? yearEnd : Array.isArray(endRaw) ? endRaw[0] : endRaw;

  const { stats, error } = await fetchPlayerStats(start, end);

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <Suspense>
        <FlashMessage />
      </Suspense>
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="stats" />

        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">個人成績明細（累計）</h1>
            <p className="mt-1 text-xs text-emerald-700/70">※ 集計対象：記録済みの全対局</p>
          </div>

          <div className="p-4">
            {/* client-side date filter that sets start/end when '当日' is checked */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <DateRangeFilter initialMode={mode} initialStart={start} initialEnd={end} actionPath="/stats" />
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
                            <dd>{player.topCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">ラス</dt>
                            <dd>{player.lastCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">トップ率</dt>
                            <dd>{pct(player.topRate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">ラス回避</dt>
                            <dd>{pct(player.lastAvoidanceRate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛ばし</dt>
                            <dd>{player.tobashiCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛び</dt>
                            <dd>{player.tobiCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">焼き鳥</dt>
                            <dd>{player.yakitoriCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">役満</dt>
                            <dd>{player.yakumanCount}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">接待率</dt>
                            <dd>{pct(player.setaiRate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛ばし率</dt>
                            <dd>{pct(player.tobashiRate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">飛び回避率</dt>
                            <dd>{pct(player.tobiAvoidanceRate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">焼き鳥回避率</dt>
                            <dd>{pct(player.yakitoriAvoidanceRate)}</dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-emerald-800/20 bg-emerald-50/80 text-xs font-semibold text-emerald-900">
                      <th className="sticky left-0 z-10 bg-emerald-50/80 px-3 py-2.5 text-left">名前</th>
                      <th className="px-3 py-2.5 text-right">合計</th>
                      <th className="px-3 py-2.5 text-center">順位</th>
                      <th className="px-3 py-2.5 text-right">対局数</th>
                      <th className="px-3 py-2.5 text-right">
                        トップ
                        <br />
                        回数
                      </th>
                      <th className="px-3 py-2.5 text-right">
                        ラス
                        <br />
                        回数
                      </th>
                      <th className="px-3 py-2.5 text-right">トップ率</th>
                      <th className="px-3 py-2.5 text-right">ラス回避</th>
                      <th className="px-3 py-2.5 text-right">飛ばし</th>
                      <th className="px-3 py-2.5 text-right">飛び</th>
                      <th className="px-3 py-2.5 text-right">焼き鳥</th>
                      <th className="px-3 py-2.5 text-right">役満</th>
                      <th className="px-3 py-2.5 text-right">飛ばし率</th>
                      <th className="px-3 py-2.5 text-right">
                        飛び
                        <br />
                        回避率
                      </th>
                      <th className="px-3 py-2.5 text-right">
                        焼き鳥
                        <br />
                        回避率
                      </th>
                      <th className="px-3 py-2.5 text-right">接待率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((player) => {
                      const rowBg = RANK_ROW_BG[player.rank] ?? "bg-white/60";
                      const badgeCls = RANK_BADGE[player.rank] ?? "bg-transparent text-foreground";

                      return (
                        <tr
                          key={player.name}
                          className={`border-b border-emerald-100 ${rowBg} transition-colors hover:bg-emerald-50/40`}
                        >
                          <td className={`sticky left-0 z-10 px-3 py-2 font-semibold ${rowBg}`}>
                            {player.name}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold tabular-nums ${
                              player.totalScore >= 0 ? "text-emerald-700" : "text-destructive"
                            }`}
                          >
                            {score(player.totalScore)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1.5 text-xs font-bold ${badgeCls}`}
                            >
                              {player.rank}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.games}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.topCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.lastCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.topRate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.lastAvoidanceRate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.tobashiCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.tobiCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.yakitoriCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{player.yakumanCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.tobashiRate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.tobiAvoidanceRate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.yakitoriAvoidanceRate)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(player.setaiRate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
