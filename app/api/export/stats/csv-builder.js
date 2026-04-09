function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build CSV string from player stats array.
 * @param {Array} stats
 * @param {{start?:string,end?:string}} opts
 * @returns {{csv:string, filename:string}}
 */
export function buildStatsCsv(stats, opts = {}) {
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
  const filename = `player-stats_${opts.start || "all"}_${opts.end || "all"}.csv`;
  return { csv, filename };
}
