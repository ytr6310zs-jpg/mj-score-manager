import React from "react";
import type { PlayerStats } from "@/lib/stats";

interface StatsSummaryTableProps {
  stats: PlayerStats[];
  title: string;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function score(v: number) {
  return String(v);
}

export const StatsSummaryTable: React.FC<StatsSummaryTableProps> = ({ stats, title }) => (
  <section className="mb-6">
    <h2 className="font-semibold mb-2 text-emerald-900">{title}</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border-collapse border">
        <thead>
          <tr className="bg-emerald-100 text-emerald-900 text-xs font-semibold">
            <th className="px-2 py-1 text-center">順位</th>
            <th className="px-2 py-1 text-left">名前</th>
            <th className="px-2 py-1 text-right">対局数</th>
            <th className="px-2 py-1 text-right">合計点</th>
            <th className="px-2 py-1 text-right">トップ回数</th>
            <th className="px-2 py-1 text-right">ラス回数</th>
            <th className="px-2 py-1 text-right">トップ率</th>
            <th className="px-2 py-1 text-right">2位率</th>
            <th className="px-2 py-1 text-right">3位率</th>
            <th className="px-2 py-1 text-right">ラス回避</th>
            <th className="px-2 py-1 text-right">飛ばし</th>
            <th className="px-2 py-1 text-right">飛び</th>
            <th className="px-2 py-1 text-right">焼き鳥</th>
            <th className="px-2 py-1 text-right">役満</th>
            <th className="px-2 py-1 text-right">飛ばし率</th>
            <th className="px-2 py-1 text-right">飛び回避率</th>
            <th className="px-2 py-1 text-right">焼き鳥回避率</th>
            <th className="px-2 py-1 text-right">接待率</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((p) => (
            <tr key={p.name} className="border-t">
              <td className="px-2 py-1 text-center">{p.rank}</td>
              <td className="px-2 py-1">{p.name}</td>
              <td className="px-2 py-1 text-right tabular-nums">{p.games}</td>
              <td className={`px-2 py-1 text-right tabular-nums ${p.totalScore >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                {score(p.totalScore)}
              </td>
              <td className="px-2 py-1 text-right">{p.topCount}</td>
              <td className="px-2 py-1 text-right">{p.lastCount}</td>
              <td className="px-2 py-1 text-right">{pct(p.topRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.secondRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.thirdRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.lastAvoidanceRate)}</td>
              <td className="px-2 py-1 text-right">{p.tobashiCount}</td>
              <td className="px-2 py-1 text-right">{p.tobiCount}</td>
              <td className="px-2 py-1 text-right">{p.yakitoriCount}</td>
              <td className="px-2 py-1 text-right">{p.yakumanCount}</td>
              <td className="px-2 py-1 text-right">{pct(p.tobashiRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.tobiAvoidanceRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.yakitoriAvoidanceRate)}</td>
              <td className="px-2 py-1 text-right">{pct(p.setaiRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
