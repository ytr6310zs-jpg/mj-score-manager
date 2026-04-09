export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function parseMinGames(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return undefined;
}

export function resolveStatsExportParams(url: URL): {
  start: string;
  end: string;
  minGames: number | undefined;
} {
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  const minGamesRaw = url.searchParams.get("minGames");
  return {
    start,
    end,
    minGames: parseMinGames(minGamesRaw),
  };
}

type StatsRow = {
  name: string;
  rank: number;
  totalScore: number;
  games: number;
  topCount: number;
  lastCount: number;
  secondRate: number;
  thirdRate: number;
  tobashiCount: number;
  tobiCount: number;
  yakitoriCount: number;
  yakumanCount: number;
  topRate: number;
  lastAvoidanceRate: number;
  tobashiRate: number;
  tobiAvoidanceRate: number;
  yakitoriAvoidanceRate: number;
  setaiRate: number;
};

export function makeStatsResponse(
  stats: StatsRow[],
  { start, end }: { start: string; end: string }
): { csv: string; filename: string; headers: Record<string, string> } {
  const headers = [
    "name",
    "rank",
    "totalScore",
    "games",
    "topCount",
    "lastCount",
    "secondRate",
    "thirdRate",
    "tobashiCount",
    "tobiCount",
    "yakitoriCount",
    "yakumanCount",
    "topRate",
    "lastAvoidanceRate",
    "tobashiRate",
    "tobiAvoidanceRate",
    "yakitoriAvoidanceRate",
    "setaiRate",
  ];

  const rows = [headers.join(",")];
  for (const p of stats) {
    rows.push([
      escapeCsv(p.name),
      escapeCsv(p.rank),
      escapeCsv(p.totalScore),
      escapeCsv(p.games),
      escapeCsv(p.topCount),
      escapeCsv(p.lastCount),
      escapeCsv(p.secondRate),
      escapeCsv(p.thirdRate),
      escapeCsv(p.tobashiCount),
      escapeCsv(p.tobiCount),
      escapeCsv(p.yakitoriCount),
      escapeCsv(p.yakumanCount),
      escapeCsv(p.topRate),
      escapeCsv(p.lastAvoidanceRate),
      escapeCsv(p.tobashiRate),
      escapeCsv(p.tobiAvoidanceRate),
      escapeCsv(p.yakitoriAvoidanceRate),
      escapeCsv(p.setaiRate),
    ].join(","));
  }

  const csv = rows.join("\r\n");
  const filename = `player-stats_${start || "all"}_${end || "all"}.csv`;
  const responseHeaders = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };

  return { csv, filename, headers: responseHeaders };
}
