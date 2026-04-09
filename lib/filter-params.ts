/**
 * Shared query parameter resolution logic for filter-enabled pages
 * (matches, stats). Handles both new 'filter' param and backward-compatible
 * 'mode/start/end' to compute final filter, start, end.
 */

export interface FilterParamConfig {
  filterRaw: unknown;
  modeRaw: unknown;
  startRaw: unknown;
  endRaw: unknown;
  minGamesRaw?: unknown;
}

export interface FilterParamResult {
  filter: string; // 'year' | 'custom' | 'YYYY-MM-DD'
  start: string;
  end: string;
  minGames?: number;
}

export function resolveFilterParams(config: FilterParamConfig): FilterParamResult {
  const { filterRaw, modeRaw, startRaw, endRaw, minGamesRaw } = config;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Helper: parse array or scalar values
  function normalize(raw: unknown): string | undefined {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return (raw[0] as string) ?? undefined;
    return String(raw);
  }

  // Helper: check if string is a date (YYYY-MM-DD)
  function isDateString(s: string | undefined): boolean {
    return !!s && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
  }

  // Resolve filter value with priority: filter > mode > start/end
  let filter: string | undefined;

  const filterNorm = normalize(filterRaw);
  if (filterNorm) {
    filter = filterNorm;
  } else {
    const modeNorm = normalize(modeRaw);
    if (modeNorm) {
      if (modeNorm === "thisYear") filter = "year";
      else if (modeNorm === "today") filter = todayStr;
      else if (modeNorm === "range") filter = "custom";
    } else {
      const startNorm = normalize(startRaw);
      const endNorm = normalize(endRaw);
      if (startNorm && endNorm) {
        if (startNorm === endNorm && isDateString(startNorm)) {
          filter = startNorm; // single date
        } else {
          filter = "custom";
        }
      }
    }
  }

  // Default to year
  if (!filter) filter = "year";

  // Compute start/end based on filter value
  let start: string;
  let end: string;

  if (filter === "year") {
    start = yearStart;
    end = yearEnd;
  } else if (filter === "custom") {
    const startNorm = normalize(startRaw);
    const endNorm = normalize(endRaw);
    start = startNorm ?? todayStr;
    end = endNorm ?? todayStr;
  } else if (isDateString(filter)) {
    // single date
    start = filter;
    end = filter;
  } else {
    // unknown filter value -> fallback to year
    start = yearStart;
    end = yearEnd;
  }

  // Parse and validate minGames
  let minGames: number | undefined;
  if (minGamesRaw) {
    const raw = Array.isArray(minGamesRaw) ? minGamesRaw[0] : minGamesRaw;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0) {
      minGames = parsed;
    }
  }

  return { filter, start, end, minGames };
}
