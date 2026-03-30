import { buildGamesCsv } from "./csv-builder.js";

/**
 * Build response payload for games export from matches array.
 * Returns an object suitable for assertions in tests.
 * @param {Array} matches
 * @param {{start?:string,end?:string}} opts
 */
export function makeGamesResponse(matches, opts = {}) {
  const { csv, filename } = buildGamesCsv(matches, opts);
  const headers = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
  return { csv, filename, headers };
}
