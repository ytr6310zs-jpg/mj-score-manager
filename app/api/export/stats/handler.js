import { buildStatsCsv } from "./csv-builder.js";

/**
 * Build response payload for stats export from player stats array.
 * @param {Array} stats
 * @param {{start?:string,end?:string}} opts
 */
export function makeStatsResponse(stats, opts = {}) {
  const { csv, filename } = buildStatsCsv(stats, opts);
  const headers = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
  return { csv, filename, headers };
}
