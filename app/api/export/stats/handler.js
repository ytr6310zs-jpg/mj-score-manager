import { resolveTournamentIdFromUrl } from "../../../../lib/tournament-filter-query.js";
import { buildStatsCsv } from "./csv-builder.js";

export function parseMinGames(raw) {
  if (raw === null || String(raw).trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return undefined;
}

export function resolveStatsExportParams(url) {
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  const minGamesRaw = url.searchParams.get("minGames");
  const tournamentId = resolveTournamentIdFromUrl(url);
  return {
    start,
    end,
    minGames: parseMinGames(minGamesRaw),
    tournamentId,
  };
}

/**
 * Build response payload for stats export from player stats array.
 * @param {Array} stats
 * @param {{start?:string,end?:string}} opts
 */
export function makeStatsResponse(stats, opts = {}) {
  const { csv, filename } = buildStatsCsv(stats, opts);
  const headers = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
  return { csv, filename, headers };
}
