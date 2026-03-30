import { NextResponse } from "next/server";
import { fetchMatchResults } from "@/lib/matches";

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

  const { matches, error } = await fetchMatchResults(start || undefined, end || undefined);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const headers = [
    "対局ID",
    "createdAt",
    "date",
    "gameType",
    "player1",
    "player2",
    "player3",
    "player4",
    "score1",
    "score2",
    "score3",
    "score4",
    "scoreTotal",
    "tobiPlayer",
    "tobashiPlayer",
    "yakitoriPlayers",
    "notes",
  ];

  const rows = [headers.join(",")];

  for (const m of matches) {
    const base = [
      escapeCsv(m.createdAt),
      escapeCsv(m.createdAt),
      escapeCsv(m.date ?? ""),
      escapeCsv(m.gameType),
    ];

    const players = (m.players || []).slice(0, 4);
    const names = players.map((p) => escapeCsv(p.name));
    while (names.length < 4) names.push("");
    const scores = players.map((p) => escapeCsv(p.score));
    while (scores.length < 4) scores.push("");

    const tail = [
      escapeCsv(m.scoreTotal ?? ""),
      escapeCsv(m.tobiPlayer ?? ""),
      escapeCsv(m.tobashiPlayer ?? ""),
      escapeCsv((m.yakitoriPlayers || []).join("; ") || ""),
      escapeCsv(m.notes ?? ""),
    ];

    rows.push([...base, ...names, ...scores, ...tail].join(","));
  }

  const csv = rows.join("\r\n");
  const filename = `matches_${start || "all"}_${end || "all"}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
