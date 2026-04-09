import { fetchPlayerStats } from "@/lib/stats";
import { resolveFilterParams } from "@/lib/filter-params";
import { makeStatsResponse } from "./handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filterRaw = url.searchParams.get("filter");
  const modeRaw = url.searchParams.get("mode");
  const startRaw = url.searchParams.get("start");
  const endRaw = url.searchParams.get("end");

  const hasAnyFilterParam = [filterRaw, modeRaw, startRaw, endRaw].some(
    (value) => value !== null && value !== ""
  );

  const resolved = hasAnyFilterParam
    ? resolveFilterParams({ filterRaw, modeRaw, startRaw, endRaw })
    : { start: "", end: "" };

  const start = resolved.start;
  const end = resolved.end;

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
