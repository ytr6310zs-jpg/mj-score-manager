"use client";

import React, { useMemo, useState } from "react";
import type { PlayerStats } from "@/lib/stats";

type SortDirection = "asc" | "desc";
type SortKey =
  | "name"
  | "totalScore"
  | "rank"
  | "games"
  | "topCount"
  | "lastCount"
  | "topRate"
  | "secondRate"
  | "thirdRate"
  | "lastAvoidanceRate"
  | "tobashiCount"
  | "tobiCount"
  | "yakitoriCount"
  | "yakumanCount"
  | "tobashiRate"
  | "tobiAvoidanceRate"
  | "yakitoriAvoidanceRate"
  | "setaiRate";

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

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function score(value: number): string {
  return String(value);
}

export default function StatsSortableTable({ stats }: { stats: PlayerStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  const sorted = useMemo(() => {
    const withIndex = stats.map((s, i) => ({ s, i }));

    const accessor = (p: PlayerStats) => {
      switch (sortKey) {
        case "name":
          return p.name;
        case "totalScore":
          return p.totalScore;
        case "rank":
          return p.rank;
        case "games":
          return p.games;
        case "topCount":
          return p.topCount;
        case "lastCount":
          return p.lastCount;
        case "topRate":
          return p.topRate;
        case "secondRate":
          return p.secondRate;
        case "thirdRate":
          return p.thirdRate;
        case "lastAvoidanceRate":
          return p.lastAvoidanceRate;
        case "tobashiCount":
          return p.tobashiCount;
        case "tobiCount":
          return p.tobiCount;
        case "yakitoriCount":
          return p.yakitoriCount;
        case "yakumanCount":
          return p.yakumanCount;
        case "tobashiRate":
          return p.tobashiRate;
        case "tobiAvoidanceRate":
          return p.tobiAvoidanceRate;
        case "yakitoriAvoidanceRate":
          return p.yakitoriAvoidanceRate;
        case "setaiRate":
          return p.setaiRate;
        default:
          return p.totalScore;
      }
    };

    withIndex.sort((a, b) => {
      const va = accessor(a.s);
      const vb = accessor(b.s);

      // string compare for names
      if (typeof va === "string" || typeof vb === "string") {
        const ra = String(va);
        const rb = String(vb);
        const cmp = ra.localeCompare(rb, undefined, { numeric: true, sensitivity: "base" });
        return direction === "asc" ? cmp : -cmp;
      }

      const na = Number(va as unknown as number);
      const nb = Number(vb as unknown as number);
      if (na === nb) return a.i - b.i; // stable
      return direction === "asc" ? na - nb : nb - na;
    });

    return withIndex.map((w) => w.s);
  }, [stats, sortKey, direction]);

  const header = (key: SortKey, label: React.ReactNode, align = "right") => {
    const isActive = sortKey === key;
    return (
      <th className={`px-3 py-2.5 text-${align}`}>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className="inline-flex items-center gap-1"
          aria-pressed={isActive}
        >
          <span>{label}</span>
          {isActive ? <span className="text-xs">{direction === "asc" ? "▲" : "▼"}</span> : null}
        </button>
      </th>
    );
  };

  return (
    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-emerald-800/20 bg-emerald-50/80 text-xs font-semibold text-emerald-900">
          <th className="sticky left-0 z-10 bg-emerald-50/80 px-3 py-2.5 text-left">名前</th>
          {header("totalScore", "合計")}
          {header("rank", "順位", "center")}
          {header("games", "対局数")}
          {header("topCount", "トップ\n回数")}
          {header("lastCount", "ラス\n回数")}
          {header("topRate", "トップ率")}
                    {header("secondRate", "2位率")}
                    {header("thirdRate", "3位率")}
          {header("lastAvoidanceRate", "ラス回避")}
          {header("tobashiCount", "飛ばし")}
          {header("tobiCount", "飛び")}
          {header("yakitoriCount", "焼き鳥")}
          {header("yakumanCount", "役満")}
          {header("tobashiRate", "飛ばし率")}
          {header("tobiAvoidanceRate", "飛び\n回避率")}
          {header("yakitoriAvoidanceRate", "焼き鳥\n回避率")}
          {header("setaiRate", "接待率")}
        </tr>
      </thead>
      <tbody>
        {sorted.map((player) => {
          const rowBg = RANK_ROW_BG[player.rank] ?? "bg-white/60";
          const badgeCls = RANK_BADGE[player.rank] ?? "bg-transparent text-foreground";

          return (
            <tr
              key={player.name}
              className={`border-b border-emerald-100 ${rowBg} transition-colors hover:bg-emerald-50/40`}
            >
              <td className={`sticky left-0 z-10 px-3 py-2 font-semibold ${rowBg}`}>{player.name}</td>
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
              <td className="px-3 py-2 text-right tabular-nums">{pct(player.secondRate)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{pct(player.thirdRate)}</td>
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
  );
}
