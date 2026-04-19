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
  tournamentIdRaw?: unknown;
}

export interface FilterParamResult {
  filter: string;
  start: string;
  end: string;
  minGames?: number;
  tournamentId?: number;
}

import { parseTournamentId } from "./tournament-filter-query.js";

export function resolveFilterParams(config: FilterParamConfig): FilterParamResult {
  const { filterRaw, modeRaw, startRaw, endRaw, minGamesRaw, tournamentIdRaw } = config;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  function normalize(raw: unknown): string | undefined {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return (raw[0] as string) ?? undefined;
    return String(raw);
  }

  function isDateString(value: string | undefined): boolean {
    return !!value && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value);
  }

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
          filter = startNorm;
        } else {
          filter = "custom";
        }
      }
    }
  }

  if (!filter) filter = "year";

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
    start = filter;
    end = filter;
  } else {
    start = yearStart;
    end = yearEnd;
  }

  let minGames: number | undefined;
  if (
    minGamesRaw !== undefined &&
    minGamesRaw !== null &&
    String(Array.isArray(minGamesRaw) ? minGamesRaw[0] : minGamesRaw).trim() !== ""
  ) {
    const raw = Array.isArray(minGamesRaw) ? minGamesRaw[0] : minGamesRaw;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0) {
      minGames = parsed;
    }
  }

  const tournamentId = parseTournamentId(tournamentIdRaw);

  return { filter, start, end, minGames, tournamentId };
}
