function isDateString(s) {
  return typeof s === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
}

const STORAGE_KEY = 'mj-score-manager:shared-filter';

export function normalizeSharedFilterState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw;
  const filter = typeof r.filter === 'string' ? r.filter : undefined;
  const start = typeof r.start === 'string' ? r.start : undefined;
  const end = typeof r.end === 'string' ? r.end : undefined;
  if (!filter) return null;
  if (filter === 'custom') {
    if (!start || !end) return null;
    if (!isDateString(start) || !isDateString(end)) return null;
  }

  const res = {
    filter: String(filter),
    start: String(start ?? ''),
    end: String(end ?? ''),
  };
  if (r.tournamentId !== undefined && r.tournamentId !== null) res.tournamentId = String(r.tournamentId);
  if (r.minGames !== undefined && r.minGames !== null) res.minGames = String(r.minGames);
  return res;
}

export function readSharedFilterState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeSharedFilterState(parsed);
  } catch {
    return null;
  }
}

export function writeSharedFilterState(state) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeSharedFilterState(state);
    if (!normalized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    try {
      window.dispatchEvent(new CustomEvent('mj:shared-filter-changed', { detail: normalized }));
    } catch {}
  } catch {}
}

export function clearSharedFilterState() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    try { window.dispatchEvent(new CustomEvent('mj:shared-filter-changed', { detail: null })); } catch {}
  } catch {}
}

export function buildSharedFilterSearchParams(state, options) {
  const params = new URLSearchParams();
  if (state.filter) params.set('filter', state.filter);
  if (state.filter === 'custom') {
    if (state.start) params.set('start', state.start);
    if (state.end) params.set('end', state.end);
  } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(state.filter)) {
    params.set('filter', state.filter);
  }
  if (state.tournamentId) params.set('tournamentId', state.tournamentId);
  if (options && options.includeMinGames && state.minGames) params.set('minGames', state.minGames);
  return params;
}

export function hasExplicitParams(search, pathname) {
  if (search.has('filter') || search.has('mode') || search.has('start') || search.has('end') || search.has('tournamentId')) return true;
  if ((pathname === '/stats' || pathname === '/compatibility') && search.has('minGames')) return true;
  return false;
}
