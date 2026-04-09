function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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
  return {
    start,
    end,
    minGames: parseMinGames(minGamesRaw),
  };
}

export function makeStatsResponse(stats, { start, end }) {
  const headers = [
    "name",
    "rank",
    "totalScore",
    "games",
    "topCount",
    "lastCount",
    "secondRate",
    "thirdRate",
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
      escapeCsv(p.secondRate),
      escapeCsv(p.thirdRate),
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
  const responseHeaders = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };

  return { csv, filename, headers: responseHeaders };
}
