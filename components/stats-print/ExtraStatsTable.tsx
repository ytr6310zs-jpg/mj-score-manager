import type { ScoreRank, SpreadRank, YakumanEvent } from "@/lib/stats-subtables";
import React from "react";

interface ExtraStatsTableProps {
  yakumanEvents: YakumanEvent[];
  highestScores: ScoreRank[];
  lowestScores: ScoreRank[];
  largestSpreads: SpreadRank[];
  titleSuffix?: string;
}

export const ExtraStatsTable: React.FC<ExtraStatsTableProps> = ({ yakumanEvents, highestScores, lowestScores, largestSpreads, titleSuffix }) => (
  <section className="mb-6">
    <h2 className="font-semibold mb-2 text-emerald-900">別表{titleSuffix ? `（${titleSuffix}）` : ""}</h2>
    <div className="grid gap-4 md:grid-cols-2 print-two-cols">
      {/* Yakuman List */}
      <div className="rounded border p-3 bg-white/95">
        <h3 className="font-semibold mb-2 text-emerald-900">役満リスト（{yakumanEvents.length}件）</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-emerald-50">
                <th className="px-2 py-1 text-left">日付</th>
                <th className="px-2 py-1 text-left">プレイヤー</th>
                <th className="px-2 py-1 text-left">役満</th>
              </tr>
            </thead>
            <tbody>
              {yakumanEvents.map((r, i) => (
                <tr key={`yak-${r.createdAt ?? "na"}-${r.gameId ?? "na"}-${r.playerName}-${r.yakumanName}-${i}`} className="border-t compact-row">
                  <td className="px-2 py-1">{r.date || "—"}</td>
                  <td className="px-2 py-1">{r.playerName}</td>
                  <td className="px-2 py-1">{r.yakumanName}{r.points ? ` (${r.points})` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Highest Scores */}
      <div className="rounded border p-3 bg-white/95">
        <h3 className="font-semibold mb-2 text-emerald-900">最高得点ランキング（{highestScores.length}件）</h3>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-emerald-50">
              <th className="px-2 py-1">日付</th>
              <th className="px-2 py-1">名前</th>
              <th className="px-2 py-1 text-right">得点</th>
            </tr>
          </thead>
          <tbody>
            {highestScores.map((r, i) => (
              <tr key={`score-hi-${r.createdAt ?? "na"}-${r.gameId ?? "na"}-${r.playerName}-${r.score}-${i}`} className="border-t compact-row">
                <td className="px-2 py-1">{r.date || "—"}</td>
                <td className="px-2 py-1">{r.playerName}</td>
                <td className="px-2 py-1 text-right">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Lowest Scores */}
      <div className="rounded border p-3 bg-white/95">
        <h3 className="font-semibold mb-2 text-emerald-900">最低得点ランキング（{lowestScores.length}件）</h3>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-emerald-50">
              <th className="px-2 py-1">日付</th>
              <th className="px-2 py-1">名前</th>
              <th className="px-2 py-1 text-right">得点</th>
            </tr>
          </thead>
          <tbody>
            {lowestScores.map((r, i) => (
              <tr key={`score-lo-${r.createdAt ?? "na"}-${r.gameId ?? "na"}-${r.playerName}-${r.score}-${i}`} className="border-t compact-row">
                <td className="px-2 py-1">{r.date || "—"}</td>
                <td className="px-2 py-1">{r.playerName}</td>
                <td className="px-2 py-1 text-right">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Largest Spreads */}
      <div className="rounded border p-3 bg-white/95">
        <h3 className="font-semibold mb-2 text-emerald-900">最大点差ランキング（{largestSpreads.length}件）</h3>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-emerald-50">
              <th className="px-2 py-1">日付</th>
              <th className="px-2 py-1">トップ</th>
              <th className="px-2 py-1">ラス</th>
              <th className="px-2 py-1 text-right">差</th>
            </tr>
          </thead>
          <tbody>
            {largestSpreads.map((r, i) => (
              <tr key={`spread-${r.createdAt ?? "na"}-${r.gameId ?? "na"}-${r.topPlayerName ?? "na"}-${r.lastPlayerName ?? "na"}-${i}`} className="border-t compact-row">
                <td className="px-2 py-1">{r.date || "—"}</td>
                <td className="px-2 py-1">{r.topPlayerName || ""}</td>
                <td className="px-2 py-1">{r.lastPlayerName || ""}</td>
                <td className="px-2 py-1 text-right">{r.spread ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);
