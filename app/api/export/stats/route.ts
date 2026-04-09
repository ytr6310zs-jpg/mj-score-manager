import { fetchPlayerStats } from "@/lib/stats";
import { makeStatsResponse, resolveStatsExportParams } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const { start, end, minGames } = resolveStatsExportParams(url);

  const { stats, error } = await fetchPlayerStats(start || undefined, end || undefined, minGames);
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { csv, filename, headers } = makeStatsResponse(stats, { start, end });
  return new Response(csv, {
    status: 200,
    headers,
  });
}
