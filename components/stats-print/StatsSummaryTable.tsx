import type { PlayerStats } from "@/lib/stats";
import { RANK_BADGE } from "@/lib/stats-rank-theme";
import React from "react";

type RankSets = { first: string[]; second: string[]; third: string[] };

interface StatsSummaryTableProps {
  stats: PlayerStats[];
  topSets: Record<string, RankSets>;
  title: string;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function score(v: number) {
  return String(v);
}

function medalBadge(topSets: Record<string, RankSets>, metric: string, playerName: string, value: React.ReactNode) {
  const sets = topSets[metric];
  if (!sets) return <>{value}</>;
  let rank = 0;
  if (sets.first?.includes(playerName)) rank = 1;
  else if (sets.second?.includes(playerName)) rank = 2;
  else if (sets.third?.includes(playerName)) rank = 3;
  if (!rank) return <>{value}</>;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1 font-bold ${RANK_BADGE[rank]}`}>
      {value}
    </span>
  );
}

export const StatsSummaryTable: React.FC<StatsSummaryTableProps> = ({ stats, topSets, title }) => (
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
              <td className="px-2 py-0 text-center align-middle leading-4">
                {RANK_BADGE[p.rank] ? (
                  <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-[10px] font-bold ${RANK_BADGE[p.rank]}`}>
                    {p.rank}
                  </span>
                ) : (
                  p.rank
                )}
              </td>
              <td className="px-2 py-0 align-middle leading-4 whitespace-nowrap">{p.name}</td>
              <td className="px-2 py-0 text-right tabular-nums align-middle leading-4">{medalBadge(topSets, "games", p.name, p.games)}</td>
              <td className={`px-2 py-0 text-right tabular-nums align-middle leading-4 ${p.totalScore >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                {score(p.totalScore)}
              </td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "topCount", p.name, p.topCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "lastCount", p.name, p.lastCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "topRate", p.name, pct(p.topRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "secondRate", p.name, pct(p.secondRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "thirdRate", p.name, pct(p.thirdRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "lastAvoidanceRate", p.name, pct(p.lastAvoidanceRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "tobashiCount", p.name, p.tobashiCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "tobiCount", p.name, p.tobiCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "yakitoriCount", p.name, p.yakitoriCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "yakumanCount", p.name, p.yakumanCount)}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "tobashiRate", p.name, pct(p.tobashiRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "tobiAvoidanceRate", p.name, pct(p.tobiAvoidanceRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "yakitoriAvoidanceRate", p.name, pct(p.yakitoriAvoidanceRate))}</td>
              <td className="px-2 py-0 text-right align-middle leading-4">{medalBadge(topSets, "setaiRate", p.name, pct(p.setaiRate))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
