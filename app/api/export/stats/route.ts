import { fetchPlayerStats } from "@/lib/stats";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  const { stats, error } = await fetchPlayerStats(start || undefined, end || undefined);
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const headers = [
    "name",
    "rank",
    "totalScore",
    "games",
    "topCount",
    "lastCount",
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
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
