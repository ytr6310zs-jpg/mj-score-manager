import { resolveFilterParams } from "@/lib/filter-params";
import { fetchPlayerStats } from "@/lib/stats";
import { makeStatsResponse, parseMinGames, resolveStatsExportParams } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filterRaw = url.searchParams.get("filter");
  const modeRaw = url.searchParams.get("mode");
  const resolvedParams = resolveStatsExportParams(url) as {
    start: string;
    end: string;
    minGames?: number;
    tournamentId?: number;
  };
  const { start: startRaw, end: endRaw, minGames: parsedMinGames, tournamentId } = resolvedParams;
  const minGamesRaw = url.searchParams.get("minGames");

  const hasDateFilterParam = [filterRaw, modeRaw, startRaw, endRaw].some(
    (value) => value !== null && value !== ""
  );

  const resolved = hasDateFilterParam
    ? resolveFilterParams({ filterRaw, modeRaw, startRaw, endRaw, minGamesRaw, tournamentIdRaw: tournamentId })
    : { start: "", end: "", minGames: undefined, tournamentId };

  const start = resolved.start;
  const end = resolved.end;
  const minGames = hasDateFilterParam ? resolved.minGames : parsedMinGames ?? parseMinGames(minGamesRaw);

  const { stats, error } = await fetchPlayerStats(start || undefined, end || undefined, minGames, {
    tournamentId: resolved.tournamentId,
  });
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { csv, headers } = makeStatsResponse(stats, { start: start || undefined, end: end || undefined });
  return new Response(csv, {
    status: 200,
    headers,
  });
}
