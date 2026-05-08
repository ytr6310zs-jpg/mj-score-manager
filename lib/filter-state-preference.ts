export type SharedFilterState = {
  filter: string;
  start: string;
  end: string;
  tournamentId?: string;
  minGames?: string;
};

const STORAGE_KEY = "mj-score-manager:shared-filter";

function isDateString(s: unknown): s is string {
  return typeof s === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
}

export function readSharedFilterState(): SharedFilterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeSharedFilterState(parsed);
  } catch {
    return null;
  }
}

export function writeSharedFilterState(state: SharedFilterState): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeSharedFilterState(state);
    if (!normalized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    try {
      // notify same-window listeners
      window.dispatchEvent(new CustomEvent("mj:shared-filter-changed", { detail: normalized }));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

export function clearSharedFilterState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    try {
      window.dispatchEvent(new CustomEvent("mj:shared-filter-changed", { detail: null }));
    } catch {}
  } catch {
    // ignore
  }
}

export function normalizeSharedFilterState(raw: unknown): SharedFilterState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const filter = typeof r.filter === "string" ? r.filter : undefined;
  const start = typeof r.start === "string" ? r.start : undefined;
  const end = typeof r.end === "string" ? r.end : undefined;
  if (!filter) return null;
  if (filter === "custom") {
    if (!start || !end) return null;
    if (!isDateString(start) || !isDateString(end)) return null;
  } else if (isDateString(filter)) {
    // treat as single-day
    // ok
  }

  const res: SharedFilterState = {
    filter: String(filter),
    start: String(start ?? ""),
    end: String(end ?? ""),
  };

  if (r.tournamentId !== undefined && r.tournamentId !== null) res.tournamentId = String(r.tournamentId);
  if (r.minGames !== undefined && r.minGames !== null) res.minGames = String(r.minGames);

  return res;
}

export function buildSharedFilterSearchParams(state: SharedFilterState, options: { includeMinGames: boolean }) {
  const params = new URLSearchParams();
  if (state.filter) params.set("filter", state.filter);
  if (state.filter === "custom") {
    if (state.start) params.set("start", state.start);
    if (state.end) params.set("end", state.end);
  } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(state.filter)) {
    params.set("filter", state.filter);
  }
  if (state.tournamentId) params.set("tournamentId", state.tournamentId);
  if (options.includeMinGames && state.minGames) params.set("minGames", state.minGames);
  return params;
}

export function hasExplicitParams(search: URLSearchParams, pathname: string) {
  // explicit if any of these present
  if (search.has("filter") || search.has("mode") || search.has("start") || search.has("end") || search.has("tournamentId")) return true;
  if ((pathname === "/stats" || pathname === "/compatibility") && search.has("minGames")) return true;
  return false;
}
