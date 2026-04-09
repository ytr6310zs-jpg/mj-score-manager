import { fetchPlayerStats } from "@/lib/stats";
import { makeStatsResponse } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  const { stats, error } = await fetchPlayerStats(start || undefined, end || undefined);
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const { csv, headers } = makeStatsResponse(stats, { start: start || undefined, end: end || undefined });
  return new Response(csv, {
    status: 200,
    headers,
  });
}
