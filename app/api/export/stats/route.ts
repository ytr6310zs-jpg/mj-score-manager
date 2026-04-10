import { fetchPlayerStats } from "@/lib/stats";
import { resolveFilterParams } from "@/lib/filter-params";
import { makeStatsResponse, parseMinGames } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filterRaw = url.searchParams.get("filter");
  const modeRaw = url.searchParams.get("mode");
  const startRaw = url.searchParams.get("start");
  const endRaw = url.searchParams.get("end");
  const minGamesRaw = url.searchParams.get("minGames");

  const hasDateFilterParam = [filterRaw, modeRaw, startRaw, endRaw].some(
    (value) => value !== null && value !== ""
  );

  const resolved = hasDateFilterParam
    ? resolveFilterParams({ filterRaw, modeRaw, startRaw, endRaw, minGamesRaw })
    : { start: "", end: "", minGames: undefined };

  const start = resolved.start;
  const end = resolved.end;
  const minGames = hasDateFilterParam ? resolved.minGames : parseMinGames(minGamesRaw);

  const { stats, error } = await fetchPlayerStats(start || undefined, end || undefined, minGames);
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { csv, headers } = makeStatsResponse(stats, { start: start || undefined, end: end || undefined });
  return new Response(csv, {
    status: 200,
    headers,
  });
}
