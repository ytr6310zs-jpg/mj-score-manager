export const LAST_TOURNAMENT_STORAGE_KEY = "mj-score-manager:last-tournament-id";

export function getLastTournamentId(): number | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(LAST_TOURNAMENT_STORAGE_KEY);
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function setLastTournamentId(id: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(id) || id <= 0) return;
  window.localStorage.setItem(LAST_TOURNAMENT_STORAGE_KEY, String(id));
}