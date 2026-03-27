import { createClient } from "@supabase/supabase-js";

export type MatchPlayer = {
  slot: number;
  name: string;
  score: number;
  rank: number;
  isTobi: boolean;
  isTobashi: boolean;
  isYakitori: boolean;
};

export type MatchResult = {
  date: string;
  gameType: "3p" | "4p";
  playerCount: number;
  scoreTotal: number;
  topPlayer: string;
  lastPlayer: string;
  tobiPlayer: string;
  tobashiPlayer: string;
  yakitoriPlayers: string[];
  notes: string;
  createdAt: string;
  players: MatchPlayer[];
};

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    return normalized === "TRUE" || normalized === "1";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function toInt(value: unknown): number {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

function toString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseEpoch(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchMatchResults(): Promise<{
  matches: MatchResult[];
  error: string | null;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      matches: [],
      error: "Supabase 連携用の環境変数が不足しています。",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { data: rows, error } = await supabase.from("games").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
    if (error || !rows) {
      return { matches: [], error: "対局履歴の取得に失敗しました。" };
    }

    const matches: MatchResult[] = (rows as any[]).map((row) => {
      const playerCount = toInt(row.player_count) || 3;
      const slots = playerCount >= 4 ? [1, 2, 3, 4] : [1, 2, 3];

      const players = slots
        .map((slot) => {
          const name = toString(row[`player${slot}`]);
          if (!name) return null;

          return {
            slot,
            name,
            score: toInt(row[`score${slot}`]),
            rank: toInt(row[`rank${slot}`]) || slots.length,
            isTobi: toBool(row[`is_tobi${slot}`]),
            isTobashi: toBool(row[`is_tobashi${slot}`]),
            isYakitori: toBool(row[`is_yakitori${slot}`]),
          } satisfies MatchPlayer;
        })
        .filter((player): player is MatchPlayer => player !== null)
        .sort((left, right) => left.rank - right.rank || left.slot - right.slot);

      return {
        date: toString(row.date),
        gameType: toString(row.game_type) === "4p" ? "4p" : "3p",
        playerCount,
        scoreTotal: toInt(row.score_total),
        topPlayer: toString(row.top_player),
        lastPlayer: toString(row.last_player),
        tobiPlayer: toString(row.tobi_player),
        tobashiPlayer: toString(row.tobashi_player),
        yakitoriPlayers: toString(row.yakitori_players)
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
        notes: toString(row.notes),
        createdAt: toString(row.created_at),
        players,
      };
    });

    return { matches, error: null };
  } catch (e) {
    return {
      matches: [],
      error: "対局履歴の取得に失敗しました。環境変数・権限を確認してください。",
    };
  }
}