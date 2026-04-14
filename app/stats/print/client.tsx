"use client";

import PrintTrigger from "@/components/print-trigger";
import { ExtraStatsTable } from "@/components/stats-print/ExtraStatsTable";
import { MatchHistoryTable } from "@/components/stats-print/MatchHistoryTable";
import { StatsSummaryTable } from "@/components/stats-print/StatsSummaryTable";
import type { MatchResult } from "@/lib/matches";
import type { PlayerStats } from "@/lib/stats";
import type { ScoreRank, SpreadRank, YakumanEvent } from "@/lib/stats-subtables";
import "./print.css";

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

export default function ClientStatsPrintPage({
  stats,
  yakumanEvents,
  highestScores,
  lowestScores,
  largestSpreads,
  matches,
  statsYearly,
  yakumanEventsYearly,
  highestScoresYearly,
  lowestScoresYearly,
  largestSpreadsYearly,
  periodLabel,
  minGamesLabel,
}: Props) {
  return (
    <main className="mx-auto min-h-screen w-full px-4 py-10">
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">MAHJONG SCORE MANAGER</p>
            <p className="text-xs text-slate-600">成績集計 印刷プレビュー</p>
          </div>
          <div className="text-xs text-slate-600">
            この画面は印刷プレビューです。印刷時には表示されません。
          </div>
        </div>
      </div>

      <div className="mb-4 no-print">
        <PrintTrigger />
      </div>

      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="rounded-xl border border-white/70 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-emerald-100 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-emerald-900">成績集計レポート</h1>
            <div className="text-sm mt-1 text-emerald-700/70">{periodLabel}</div>
            <div className="text-sm text-emerald-700/70">{minGamesLabel}</div>
            {/* summary counts removed per design */}
          </div>

          <div className="p-4">
            <StatsSummaryTable stats={stats ?? []} title="成績集計" />

            <ExtraStatsTable
              yakumanEvents={yakumanEvents ?? []}
              highestScores={highestScores ?? []}
              lowestScores={lowestScores ?? []}
              largestSpreads={largestSpreads ?? []}
            />

            <div className="break-after-page page-break-after-always" />

            <MatchHistoryTable matches={matches ?? []} />

            <div className="break-after-page page-break-after-always" />
            <StatsSummaryTable stats={statsYearly ?? []} title="成績集計（今年・20試合以上）" />

            <ExtraStatsTable
              yakumanEvents={yakumanEventsYearly ?? []}
              highestScores={highestScoresYearly ?? []}
              lowestScores={lowestScoresYearly ?? []}
              largestSpreads={largestSpreadsYearly ?? []}
              titleSuffix="今年・20試合以上"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
