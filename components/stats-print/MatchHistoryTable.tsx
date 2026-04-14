import type { MatchResult } from "@/lib/matches";
import React from "react";

function signedScore(v: number | undefined): string {
  if (v === undefined || v === null) return "0";
  return v > 0 ? `+${v}` : `${v}`;
}

function scoreClass(v: number | undefined): string {
  if (v === undefined || v === null) return "";
  return v >= 0 ? "text-sky-700" : "text-destructive";
}

interface MatchHistoryTableProps {
  matches: MatchResult[];
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({ matches }) => {
  const has4p = matches.some((m) => (Array.isArray(m.players) ? m.players.length : 0) === 4);
  return (
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
              return (
                <tr key={`match-${m.createdAt ?? i}`} className="border-b compact-row align-top">
                  <td className="px-2 py-1 whitespace-nowrap">{m.date || "—"}</td>
                  <td className="px-2 py-1 text-center">{m.gameType.toUpperCase()}</td>
                  {[p1, p2, p3, has4p ? p4 : undefined].filter(Boolean).map((p, idx) => (
                    <td key={idx} className="px-2 py-1 align-top">
                      {p ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-emerald-950">{p.name}</span>
                            <span className={`shrink-0 tabular-nums ${scoreClass(p.score)}`}>{signedScore(p.score)}</span>
                          </div>
                          <div className="mt-1 text-xs flex flex-wrap gap-1 items-center">
                            {[p.isTobi && "飛び", p.isTobashi && "飛ばし", p.isYakitori && "焼き鳥"]
                              .filter(Boolean)
                              .map((b, idx2) => (
                                <span key={idx2} className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-semibold text-amber-900">{b}</span>
                              ))}
                            {p.yakumans?.length ? (
                              <span className="inline-flex rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900 ml-1">
                                {p.yakumans.map((y) => y.name).join("、")}
                              </span>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
