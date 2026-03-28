interface MatchPlayer {
  id?: string;
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
}

export function makeGamesResponse(matches: MatchRow[], opts?: { start?: string; end?: string }): { csv: string; filename: string; headers: Record<string, string> };
