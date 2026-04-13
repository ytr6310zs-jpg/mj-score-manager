"use client";

import PrintTrigger from "@/components/print-trigger";
import "./print.css";

import type { MatchResult } from "@/lib/matches";
import type { PlayerStats } from "@/lib/stats";
import type { ScoreRank, SpreadRank, YakumanEvent } from "@/lib/stats-subtables";

type Props = {
  stats: PlayerStats[];
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
  matches: MatchResult[];
  statsYearly: PlayerStats[];
  yakumanEventsYearly: YakumanEvent[];
  highestScoresYearly: ScoreRank[];
  lowestScoresYearly: ScoreRank[];
  largestSpreadsYearly: SpreadRank[];
  periodLabel: string;
  minGamesLabel: string;
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function renderScoreRanks(rows: ScoreRank[], title: string) {
  return (
    <section className="rounded border p-3">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-emerald-50">
                <th className="px-2 py-1 text-left">日付</th>
                <th className="px-2 py-1 text-left">プレイヤー</th>
                <th className="px-2 py-1 text-right">点数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.gameId}-${i}`} className="border-t compact-row">
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
  );
}

function renderSpreadRanks(rows: SpreadRank[], title: string) {
  return (
    <section className="rounded border p-3">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-emerald-50">
                <th className="px-2 py-1 text-left">日付</th>
                <th className="px-2 py-1 text-left">上位</th>
                <th className="px-2 py-1 text-left">下位</th>
                <th className="px-2 py-1 text-right">差</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={`${s.gameId}-${i}`} className="border-t compact-row">
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
  );
}

function renderYakumanEvents(rows: YakumanEvent[], title: string) {
  return (
    <section className="rounded border p-3">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">該当データがありません。</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-emerald-50">
                <th className="px-2 py-1 text-left">日付</th>
                <th className="px-2 py-1 text-left">プレイヤー</th>
                <th className="px-2 py-1 text-left">役</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((y, i) => (
                <tr key={`${y.gameId}-${i}`} className="border-t compact-row">
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
  );
}

export default function ClientStatsPrintPage({
  stats,
  matches,
  statsYearly,
  yakumanEventsYearly,
  highestScoresYearly,
  lowestScoresYearly,
  largestSpreadsYearly,
  periodLabel,
  minGamesLabel,
}: Props) {
  const has4p = matches.some((m) => m.gameType === "4p");
  const expectedPages = Math.max(1, Math.ceil(matches.length / 28));

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <PrintTrigger />

      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">成績集計レポート</h1>
            <div className="text-sm mt-1 text-emerald-700/70">{periodLabel}</div>
            <div className="text-sm text-emerald-700/70">{minGamesLabel}</div>
            <div className="mt-2 inline-flex items-center gap-3 rounded border border-emerald-100 bg-emerald-50/60 px-2 py-1 text-xs text-emerald-800">
              <span>総件数: {matches.length}</span>
              <span>想定ページ数(目安): {expectedPages}</span>
            </div>
          </div>

          <div className="p-4">
            {/* 1. 成績集計 */}
            <section className="mb-6">
              <h2 className="font-semibold mb-2 text-emerald-900">成績集計</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-emerald-100">
                      <th className="px-2 py-1">順位</th>
                      <th className="px-2 py-1">名前</th>
                      <th className="px-2 py-1">対局数</th>
                      <th className="px-2 py-1">合計点</th>
                      <th className="px-2 py-1">トップ率</th>
                      <th className="px-2 py-1">ラス回避</th>
                      <th className="px-2 py-1">飛ばし率</th>
                      <th className="px-2 py-1">飛び回避率</th>
                      <th className="px-2 py-1">焼き鳥回避率</th>
                      <th className="px-2 py-1">接待率</th>
                      <th className="px-2 py-1">役満</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((p) => (
                      <tr key={p.name} className="border-t compact-row">
                        <td className="px-2 py-1 text-center">{p.rank}</td>
                        <td className="px-2 py-1">{p.name}</td>
                        <td className="px-2 py-1 text-center">{p.games}</td>
                        <td className="px-2 py-1 text-right">{p.totalScore}</td>
                        <td className="px-2 py-1 text-right">{pct(p.topRate)}</td>
                        <td className="px-2 py-1 text-right">{pct(p.lastAvoidanceRate)}</td>
                        <td className="px-2 py-1 text-right">{pct(p.tobashiRate)}</td>
                        <td className="px-2 py-1 text-right">{pct(p.tobiAvoidanceRate)}</td>
                        <td className="px-2 py-1 text-right">{pct(p.yakitoriAvoidanceRate)}</td>
                        <td className="px-2 py-1 text-right">{pct(p.setaiRate)}</td>
                        <td className="px-2 py-1 text-center">{p.yakumanCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. 対局履歴（1試合2行表示） */}
            <section className="mb-6">
              <h2 className="font-semibold mb-2 text-emerald-900 no-break-after">対局履歴</h2>
              <div className="overflow-x-auto no-break-before">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-emerald-800/20 bg-emerald-50/80 font-semibold text-emerald-900">
                      <th className="px-2 py-1 text-left">対局日</th>
                      <th className="px-2 py-1 text-center">形式</th>
                      <th className="px-2 py-1 text-left">1位</th>
                      <th className="px-2 py-1 text-left">2位</th>
                      <th className="px-2 py-1 text-left">3位</th>
                      {has4p && <th className="px-2 py-1 text-left">4位</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => {
                      const sorted = [...m.players].sort((a, b) => a.rank - b.rank);
                      const p1 = sorted.find((p) => p.rank === 1);
                      const p2 = sorted.find((p) => p.rank === 2);
                      const p3 = sorted.find((p) => p.rank === 3);
                      const p4 = sorted.find((p) => p.rank === 4);
                      const scoreLabel = (p?: { score?: number } | undefined) =>
                        p ? `${p.score! >= 0 ? `+${p.score}` : p.score}` : "";

                      return (
                        <>
                          <tr key={`row-a-${m.createdAt ?? i}`} className="border-b compact-row align-top">
                            <td className="px-2 py-1 whitespace-nowrap">{m.date || "—"}</td>
                            <td className="px-2 py-1 text-center">{m.gameType.toUpperCase()}</td>
                            <td className="px-2 py-1">{p1?.name || "—"} {p1 ? <span className="text-xs">{scoreLabel(p1)}</span> : null}</td>
                            <td className="px-2 py-1">{p2?.name || "—"} {p2 ? <span className="text-xs">{scoreLabel(p2)}</span> : null}</td>
                            <td className="px-2 py-1">{p3?.name || "—"} {p3 ? <span className="text-xs">{scoreLabel(p3)}</span> : null}</td>
                            {has4p && <td className="px-2 py-1">{p4?.name || "—"} {p4 ? <span className="text-xs">{scoreLabel(p4)}</span> : null}</td>}
                          </tr>

                          <tr key={`row-b-${m.createdAt ?? i}`} className="compact-row">
                            <td className="px-2 py-0.5" />
                            <td className="px-2 py-0.5" />
                            <td className="px-2 py-0.5 text-xs">
                              {p1 && (
                                <>
                                  <div className="text-emerald-700/90">
                                    {p1.isTobashi && <span className="mr-1">飛ばし</span>}
                                    {p1.isTobi && <span className="mr-1">飛び</span>}
                                    {p1.isYakitori && <span className="mr-1">焼き鳥</span>}
                                  </div>
                                  {p1.yakumans?.length ? (
                                    <div className="text-sky-900">{p1.yakumans.map((y) => y.name).join(", ")}</div>
                                  ) : null}
                                </>
                              )}
                            </td>
                            <td className="px-2 py-0.5 text-xs">
                              {p2 && (
                                <>
                                  <div className="text-emerald-700/90">
                                    {p2.isTobashi && <span className="mr-1">飛ばし</span>}
                                    {p2.isTobi && <span className="mr-1">飛び</span>}
                                    {p2.isYakitori && <span className="mr-1">焼き鳥</span>}
                                  </div>
                                  {p2.yakumans?.length ? (
                                    <div className="text-sky-900">{p2.yakumans.map((y) => y.name).join(", ")}</div>
                                  ) : null}
                                </>
                              )}
                            </td>
                            <td className="px-2 py-0.5 text-xs">
                              {p3 && (
                                <>
                                  <div className="text-emerald-700/90">
                                    {p3.isTobashi && <span className="mr-1">飛ばし</span>}
                                    {p3.isTobi && <span className="mr-1">飛び</span>}
                                    {p3.isYakitori && <span className="mr-1">焼き鳥</span>}
                                  </div>
                                  {p3.yakumans?.length ? (
                                    <div className="text-sky-900">{p3.yakumans.map((y) => y.name).join(", ")}</div>
                                  ) : null}
                                </>
                              )}
                            </td>
                            {has4p && (
                              <td className="px-2 py-0.5 text-xs">
                                {p4 && (
                                  <>
                                    <div className="text-emerald-700/90">
                                      {p4.isTobashi && <span className="mr-1">飛ばし</span>}
                                      {p4.isTobi && <span className="mr-1">飛び</span>}
                                      {p4.isYakitori && <span className="mr-1">焼き鳥</span>}
                                    </div>
                                    {p4.yakumans?.length ? (
                                      <div className="text-sky-900">{p4.yakumans.map((y) => y.name).join(", ")}</div>
                                    ) : null}
                                  </>
                                )}
                              </td>
                            )}
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. 成績集計（今年・20試合以上） */}
            <section className="mb-6">
              <h2 className="font-semibold mb-2 text-emerald-900">成績集計（今年・20試合以上）</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-emerald-50">
                      <th className="px-2 py-1">順位</th>
                      <th className="px-2 py-1">名前</th>
                      <th className="px-2 py-1">対局数</th>
                      <th className="px-2 py-1">合計点</th>
                      <th className="px-2 py-1">トップ率</th>
                      <th className="px-2 py-1">役満</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsYearly.length === 0 ? (
                      <tr>
                        <td className="px-2 py-2 text-muted-foreground" colSpan={6}>
                          該当データがありません。
                        </td>
                      </tr>
                    ) : (
                      statsYearly.map((p) => (
                        <tr key={`year-${p.name}`} className="border-t compact-row">
                          <td className="px-2 py-1 text-center">{p.rank}</td>
                          <td className="px-2 py-1">{p.name}</td>
                          <td className="px-2 py-1 text-center">{p.games}</td>
                          <td className="px-2 py-1 text-right">{p.totalScore}</td>
                          <td className="px-2 py-1 text-right">{pct(p.topRate)}</td>
                          <td className="px-2 py-1 text-center">{p.yakumanCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. 別表（今年・20試合以上） */}
            <section className="mb-6">
              <h2 className="font-semibold mb-2 text-emerald-900">別表（今年・20試合以上）</h2>
              <div className="grid gap-4 md:grid-cols-2 print-two-cols">
                {renderYakumanEvents(yakumanEventsYearly, `役満リスト（今年 ${yakumanEventsYearly.length}件）`)}
                {renderScoreRanks(highestScoresYearly, `最高得点ランキング（今年 ${highestScoresYearly.length}件）`)}
                {renderScoreRanks(lowestScoresYearly, `最低得点ランキング（今年 ${lowestScoresYearly.length}件）`)}
                {renderSpreadRanks(largestSpreadsYearly, `最大点差ランキング（今年 ${largestSpreadsYearly.length}件）`)}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
