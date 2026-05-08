// JS wrapper for tests: replicate resolveFilterParams logic from TypeScript
export function resolveFilterParams(config) {
  const { filterRaw, modeRaw, startRaw, endRaw, minGamesRaw, tournamentIdRaw } = config;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  function normalize(raw) {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return raw[0];
    return String(raw);
  }

  function isDateString(value) {
    return !!value && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value);
  }

  let filter;
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

  let start;
  let end;
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

  let minGames;
  if (minGamesRaw !== undefined && minGamesRaw !== null && String(Array.isArray(minGamesRaw) ? minGamesRaw[0] : minGamesRaw).trim() !== "") {
    const raw = Array.isArray(minGamesRaw) ? minGamesRaw[0] : minGamesRaw;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0) {
      minGames = parsed;
    }
  }

  // parseTournamentId is not required for these tests; simple coercion
  let tournamentId;
  if (tournamentIdRaw !== undefined && tournamentIdRaw !== null) {
    const raw = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
    const parsed = Number(raw);
    if (Number.isInteger(parsed)) tournamentId = parsed;
  }

  return { filter, start, end, minGames, tournamentId };
}
