import type { PlayerStats } from "@/lib/stats";
import React from "react";

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
          <tr className="bg-emerald-100 text-emerald-900 text-xs font-semibold h-8">
            <th className="px-2 py-0 text-center align-middle leading-4">順位</th>
            <th className="px-2 py-0 text-left align-middle leading-4">名前</th>
            <th className="px-2 py-0 text-right align-middle leading-4">対局数</th>
            <th className="px-2 py-0 text-right align-middle leading-4">合計点</th>
            <th className="px-2 py-0 text-right align-middle leading-4">トップ回数</th>
            <th className="px-2 py-0 text-right align-middle leading-4">ラス回数</th>
            <th className="px-2 py-0 text-right align-middle leading-4">トップ率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">2位率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">3位率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">ラス回避</th>
            <th className="px-2 py-0 text-right align-middle leading-4">飛ばし</th>
            <th className="px-2 py-0 text-right align-middle leading-4">飛び</th>
            <th className="px-2 py-0 text-right align-middle leading-4">焼き鳥</th>
            <th className="px-2 py-0 text-right align-middle leading-4">役満</th>
            <th className="px-2 py-0 text-right align-middle leading-4">飛ばし率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">飛び回避率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">焼き鳥回避率</th>
            <th className="px-2 py-0 text-right align-middle leading-4">接待率</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((p) => (
            <tr key={p.name} className="border-t h-8">
              <td className="px-2 py-0 text-center align-middle leading-4">{p.rank}</td>
              <td className="px-2 py-0 align-middle leading-4 whitespace-nowrap">{p.name}</td>
              <td className="px-2 py-0 text-right tabular-nums align-middle leading-4">{p.games}</td>
              <td className={`px-2 py-0 text-right tabular-nums align-middle leading-4 ${p.totalScore >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                {score(p.totalScore)}
              </td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.topCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.lastCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.topRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.secondRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.thirdRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.lastAvoidanceRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.tobashiCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.tobiCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.yakitoriCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{p.yakumanCount}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.tobashiRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.tobiAvoidanceRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.yakitoriAvoidanceRate)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{pct(p.setaiRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
