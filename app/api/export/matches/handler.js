import { resolveTournamentIdFromUrl } from "../../../../lib/tournament-filter-query.js";

export function resolveMatchesExportParams(url) {
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  return {
    start,
    end,
    tournamentId: resolveTournamentIdFromUrl(url),
  };
}
