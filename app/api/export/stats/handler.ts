import { buildStatsCsv } from "./csv-builder.js";

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
  { start, end }: { start?: string; end?: string }
): { csv: string; filename: string; headers: Record<string, string> } {
  const { csv, filename } = buildStatsCsv(stats, { start, end });
  const responseHeaders = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };

  return { csv, filename, headers: responseHeaders };
}
