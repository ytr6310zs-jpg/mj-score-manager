interface MatchPlayer {
  id?: number | null;
  name?: string;
  slot?: number;
  score?: number;
}

interface MatchRow {
  createdAt?: string;
  date?: string;
  playerCount?: number;
  players?: MatchPlayer[];
  notes?: string;
  topPlayerId?: number | null;
  lastPlayerId?: number | null;
  tobiPlayerId?: number | null;
  tobashiPlayerId?: number | null;
  yakitoriPlayerIds?: number[];
}

export function makeGamesResponse(matches: MatchRow[], opts?: { start?: string; end?: string }): { csv: string; filename: string; headers: Record<string, string> };
