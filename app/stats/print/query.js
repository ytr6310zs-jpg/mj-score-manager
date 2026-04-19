/**
 * Build stats print path while preserving existing query string.
 * @param {string} query
 */
export function buildStatsPrintPath(query) {
  return `/stats/print${query ? `?${query}` : ""}`;
}
