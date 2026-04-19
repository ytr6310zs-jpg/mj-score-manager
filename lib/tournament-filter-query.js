export function parseTournamentId(raw) {
  if (raw === undefined || raw === null) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const text = String(value).trim();
  if (!text) return undefined;

  const parsed = Number(text);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export function resolveTournamentIdFromUrl(url) {
  return parseTournamentId(url.searchParams.get("tournamentId"));
}
