import type { Metadata } from "next";
import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import CsvExportButton from "@/components/csv-export-button";
import DateRangeFilter from "@/components/date-range-filter";
import { FlashMessage } from "@/components/flash-message";
import { MatchDeleteButton } from "@/components/match-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { fetchMatchResults, type MatchPlayer } from "@/lib/matches";
import Link from "next/link";

export const metadata: Metadata = {
  title: "対局履歴 | 麻雀成績入力",
  description: "各対局のスコア・順位・飛び/飛ばし/焼き鳥を一覧表示します",
};

export const dynamic = "force-dynamic";

function signedScore(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function resultBadge(player: MatchPlayer): string {
  if (player.rank === 1) return "🏆";
  if (player.isTobi) return "飛び";
  if (player.isTobashi) return "飛ばし";
  if (player.isYakitori) return "焼き鳥";
  return "";
}

type SearchParams = { [key: string]: string | string[] | undefined } | undefined;

export default async function MatchesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
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

  const { matches, error } = await fetchMatchResults(start, end);

  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <Suspense>
        <FlashMessage />
      </Suspense>
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <AppHeader current="matches" />

        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">対局履歴</h1>
            <p className="mt-1 text-xs text-emerald-700/70">
              日付順に、各対局の順位・スコア・特記事項を確認できます。
            </p>
          </div>

          <div className="p-4">
            {/* client-side date filter that sets start/end when '当日' is checked */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <DateRangeFilter initialMode={mode} initialStart={start} initialEnd={end} actionPath="/matches" />
              </div>
            </div>
            {error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : matches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                まだ対局データがありません。スコア入力画面から登録してください。
              </p>
            ) : (
              <>
                <div className="space-y-4 md:hidden">
                  {matches.map((match, index) => (
                    <article
                      key={`${match.createdAt}-${index}`}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{match.date || "-"}</p>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {match.gameType.toUpperCase()} / 合計 {signedScore(match.scoreTotal)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Link
                            href={`/matches/${encodeURIComponent(match.createdAt)}/edit`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            編集
                          </Link>
                          <MatchDeleteButton createdAt={match.createdAt} />
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {match.players.map((player) => {
                          const badge = resultBadge(player);
                          return (
                            <li
                              key={`${match.createdAt}-${player.slot}`}
                              className="rounded-md bg-white/80 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="inline-flex min-w-10 justify-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                                    {player.rank}位
                                  </span>
                                  <span className="truncate font-medium text-emerald-950">{player.name}</span>
                                </div>
                                <span
                                  className={`shrink-0 tabular-nums ${
                                    player.score >= 0 ? "text-emerald-700" : "text-destructive"
                                  }`}
                                >
                                  {signedScore(player.score)}
                                </span>
                              </div>
                              {badge ? (
                                <p className="mt-2 text-xs font-semibold text-amber-900">{badge}</p>
                              ) : null}
                              {player.yakumans && player.yakumans.length > 0 ? (
                                <p className="mt-2">
                                  <span className="inline-flex rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900">
                                    {player.yakumans.map((y) => y.name).join("、")}
                                  </span>
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>

                      <dl className="mt-4 space-y-2 text-xs text-emerald-900/80">
                        <div>
                          <dt className="font-semibold text-emerald-900">飛び / 飛ばし</dt>
                          <dd>
                            {match.tobiPlayer || match.tobashiPlayer
                              ? `飛び: ${match.tobiPlayer || "-"} / 飛ばし: ${match.tobashiPlayer || "-"}`
                              : "-"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-emerald-900">焼き鳥</dt>
                          <dd>{match.yakitoriPlayers.length > 0 ? match.yakitoriPlayers.join("、") : "-"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-emerald-900">備考</dt>
                          <dd className="whitespace-pre-wrap">{match.notes || "-"}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-emerald-800/20 bg-emerald-50/80 text-xs font-semibold text-emerald-900">
                      <th className="px-3 py-2.5 text-left">対局日</th>
                      <th className="px-3 py-2.5 text-center">形式</th>
                      <th className="px-3 py-2.5 text-left">順位 / プレイヤー</th>
                      <th className="px-3 py-2.5 text-right">合計</th>
                      <th className="px-3 py-2.5 text-left">飛び/飛ばし</th>
                      <th className="px-3 py-2.5 text-left">焼き鳥</th>
                      <th className="px-3 py-2.5 text-left">備考</th>
                      <th className="px-3 py-2.5 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match, index) => (
                      <tr
                        key={`${match.createdAt}-${index}`}
                        className="border-b border-emerald-100 align-top transition-colors hover:bg-emerald-50/40"
                      >
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-emerald-900">
                          {match.date || "-"}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                          {match.gameType.toUpperCase()}
                        </td>
                        <td className="px-3 py-3">
                          <ul className="space-y-1">
                            {match.players.map((player) => {
                              const badge = resultBadge(player);
                              return (
                                <li key={`${match.createdAt}-${player.slot}`} className="flex items-center gap-2">
                                  <span className="inline-flex min-w-10 justify-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                                    {player.rank}位
                                  </span>
                                  <span className="min-w-20 font-medium">{player.name}</span>
                                  <span
                                    className={`tabular-nums ${
                                      player.score >= 0 ? "text-emerald-700" : "text-destructive"
                                    }`}
                                  >
                                    {signedScore(player.score)}
                                  </span>
                                  {badge ? (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                                      {badge}
                                    </span>
                                  ) : null}
                                  {player.yakumans && player.yakumans.length > 0 ? (
                                    <span className="ml-2 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-900">
                                      {player.yakumans.map((y) => y.name).join("、")}
                                    </span>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-800">
                          {signedScore(match.scoreTotal)}
                        </td>
                        <td className="px-3 py-3 text-xs text-emerald-900/80">
                          {match.tobiPlayer || match.tobashiPlayer
                            ? `飛び: ${match.tobiPlayer || "-"} / 飛ばし: ${match.tobashiPlayer || "-"}`
                            : "-"}
                        </td>
                        <td className="px-3 py-3 text-xs text-emerald-900/80">
                          {match.yakitoriPlayers.length > 0 ? match.yakitoriPlayers.join("、") : "-"}
                        </td>
                        <td className="px-3 py-3 text-xs text-emerald-900/80">{match.notes || "-"}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Link href={`/matches/${encodeURIComponent(match.createdAt)}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                              編集
                            </Link>
                            <MatchDeleteButton createdAt={match.createdAt} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}

            {/* CSV 出力（表の下部右寄せ） */}
            <div className="flex justify-end mt-3">
              <CsvExportButton
                apiPath="/api/export/games"
                className="rounded bg-emerald-600 px-3 text-sm text-white h-10 flex items-center justify-center"
              >
                CSV 出力
              </CsvExportButton>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
