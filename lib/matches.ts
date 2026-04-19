import { createClient } from "@supabase/supabase-js";

export type YakumanOccurrence = {
  code: string;
  name: string;
  points: number | null;
};

export type MatchPlayer = {
  slot: number;
  id: number | null;
  name: string;
  score: number;
  rank: number;
  isTobi: boolean;
  isTobashi: boolean;
  isYakitori: boolean;
  yakumans?: YakumanOccurrence[];
};

export type MatchResult = {
  id?: number;
  tournamentId: number | null;
  tournamentName: string;
  date: string;
  gameType: "3p" | "4p";
  playerCount: number;
  scoreTotal: number;
  topPlayer: string;
  topPlayerId: number | null;
  lastPlayer: string;
  lastPlayerId: number | null;
  tobiPlayer: string | null;
  tobiPlayerId: number | null;
  tobashiPlayer: string | null;
  tobashiPlayerId: number | null;
  yakitoriPlayers: string[];
  yakitoriPlayerIds: number[];
  notes: string;
  createdAt: string;
  players: MatchPlayer[];
};

export type MatchQueryOptions = {
  tournamentId?: number;
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

export async function fetchMatchResults(startDate?: string, endDate?: string, options: MatchQueryOptions = {}): Promise<{
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
    const selection = `id,tournament_id,tournaments(name),date,game_type,player_count,player1,player2,player3,player4,player1_id,player2_id,player3_id,player4_id,score1,score2,score3,score4,rank1,rank2,rank3,rank4,is_tobi1,is_tobi2,is_tobi3,is_tobi4,is_tobashi1,is_tobashi2,is_tobashi3,is_tobashi4,is_yakitori1,is_yakitori2,is_yakitori3,is_yakitori4,score_total,top_player,top_player_id,last_player,last_player_id,tobi_player,tobi_player_id,tobashi_player,tobashi_player_id,yakitori_players,yakitori_player_ids,notes,created_at`;

    let qb = supabase.from("games").select(selection);
    if (typeof options.tournamentId === "number") qb = qb.eq("tournament_id", options.tournamentId);
    if (startDate) qb = qb.gte("date", startDate);
    if (endDate) qb = qb.lte("date", endDate);
    qb = qb.order("date", { ascending: false }).order("created_at", { ascending: false });

    const { data, error } = await qb;
    if (error || !data) {
      console.error("fetchMatchResults supabase error:", error);
      return { matches: [], error: "対局履歴の取得に失敗しました。Supabase の設定を確認してください。" };
    }

    const rows = data as Array<Record<string, unknown>>;

    // build match objects and keep id for yakuman lookup
    const games = rows.map((row) => {
      const playerCount = toInt(row["player_count"] ?? row["playerCount"]) || 3;
      const slots = playerCount >= 4 ? [1, 2, 3, 4] : [1, 2, 3];

      const players: MatchPlayer[] = slots
        .map((slot) => {
          const name = toString(row[`player${slot}`]);
          if (!name) return null;
          const rawId = row[`player${slot}_id`];
          return {
            slot,
            id: rawId !== null && rawId !== undefined ? Number(rawId) : null,
            name,
            score: toInt(row[`score${slot}`]),
            rank: toInt(row[`rank${slot}`]) || slots.length,
            isTobi: toBool(row[`is_tobi${slot}`]),
            isTobashi: toBool(row[`is_tobashi${slot}`]),
            isYakitori: toBool(row[`is_yakitori${slot}`]),
            yakumans: [],
          } as MatchPlayer;
        })
        .filter((p): p is MatchPlayer => p !== null)
        .sort((a, b) => a.rank - b.rank || a.slot - b.slot);

      const createdAtRaw = row["created_at"] ?? row["createdAt"] ?? null;
      const createdAt = createdAtRaw ? new Date(String(createdAtRaw)).toISOString() : "";

      const toNullableId = (v: unknown) => (v !== null && v !== undefined ? Number(v) : null);
      const rawYakitoriIds = row["yakitori_player_ids"];
      const yakitoriPlayerIds: number[] = Array.isArray(rawYakitoriIds)
        ? (rawYakitoriIds as unknown[]).map(Number).filter((n) => Number.isFinite(n))
        : [];
      const rawTournament = row["tournaments"] as { name?: unknown } | Array<{ name?: unknown }> | null | undefined;
      const tournamentRelation = Array.isArray(rawTournament) ? rawTournament[0] : rawTournament;

      return {
        id: Number(row["id"] ?? 0),
        tournamentId: toNullableId(row["tournament_id"]),
        tournamentName: tournamentRelation?.name ? String(tournamentRelation.name) : "",
        date: toString(row["date"]),
        gameType: String(row["game_type"] ?? "") === "4p" ? ("4p" as const) : ("3p" as const),
        playerCount,
        scoreTotal: toInt(row["score_total"]),
        topPlayer: toString(row["top_player"]),
        topPlayerId: toNullableId(row["top_player_id"]),
        lastPlayer: toString(row["last_player"]),
        lastPlayerId: toNullableId(row["last_player_id"]),
        tobiPlayer: row["tobi_player"] ? String(row["tobi_player"]) : null,
        tobiPlayerId: toNullableId(row["tobi_player_id"]),
        tobashiPlayer: row["tobashi_player"] ? String(row["tobashi_player"]) : null,
        tobashiPlayerId: toNullableId(row["tobashi_player_id"]),
        yakitoriPlayers: String(row["yakitori_players"] ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        yakitoriPlayerIds,
        notes: toString(row["notes"]),
        createdAt,
        players,
      } as MatchResult;
    });

    // fetch yakuman occurrences for these games
    const gameIds = games.map((g) => g.id).filter(Boolean);
    if (gameIds.length > 0) {
      const { data: yakData, error: yakErr } = await supabase
        .from("yakuman_occurrences")
        .select("id,game_id,player_id,yakuman_code,yakuman_name,points,created_at,players(id,name)")
        .in("game_id", gameIds)
        .order("created_at", { ascending: true });

      if (!yakErr && yakData && Array.isArray(yakData)) {
        const yakRows = yakData as Array<Record<string, unknown>>;
        const yakByGame = new Map<number, Array<Record<string, unknown>>>();
        for (const r of yakRows) {
          const gid = Number(r["game_id"] ?? 0);
          if (!yakByGame.has(gid)) yakByGame.set(gid, []);
          yakByGame.get(gid)!.push(r);
        }

        for (const g of games) {
          const rowsForGame = yakByGame.get(g.id ?? 0) ?? [];
          for (const r of rowsForGame) {
              const playersObj = (r["players"] ?? null) as Record<string, unknown> | null;
              const playerName = playersObj && typeof playersObj["name"] === "string" ? String(playersObj["name"]) : "";
            const yak = {
              code: String(r["yakuman_code"] ?? ""),
              name: String(r["yakuman_name"] ?? ""),
              points: r["points"] === null || r["points"] === undefined ? null : Number(r["points"]),
            } as YakumanOccurrence;

            const p = g.players.find((pl) => pl.name === playerName);
            if (p) {
              p.yakumans = p.yakumans ?? [];
              p.yakumans.push(yak);
            }
          }
        }
      }
    }

    // sort (fallback) by date desc then created_at desc
    games.sort((left, right) => {
      const byDate = String(left.date ?? "").localeCompare(String(right.date ?? ""));
      if (byDate !== 0) return -byDate;
      const byCreatedAt = parseEpoch(left.createdAt) - parseEpoch(right.createdAt);
      return -byCreatedAt;
    });

    // apply start/end filters by date only (YYYY-MM-DD)
    function toLocalYMD(dt: Date) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    const filtered = games.filter((m) => {
      if (!m.date) return false;
      try {
        const d = new Date(m.date);
        if (Number.isNaN(d.getTime())) return false;

        const dateStr = toLocalYMD(d);

        if (startDate) {
          const s = new Date(startDate);
          if (!Number.isNaN(s.getTime())) {
            const sStr = toLocalYMD(s);
            if (dateStr < sStr) return false;
          }
        }
        if (endDate) {
          const e = new Date(endDate);
          if (!Number.isNaN(e.getTime())) {
            const eStr = toLocalYMD(e);
            if (dateStr > eStr) return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    });

    return {
      matches: filtered,
      error: null,
    };
  } catch (err) {
    console.error("fetchMatchResults error:", err);
    return {
      matches: [],
      error: "対局履歴の取得に失敗しました。Supabase の設定を確認してください。",
    };
  }
}

export async function fetchMatchDates(options: MatchQueryOptions = {}): Promise<{ dates: string[]; error: string | null }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { dates: [], error: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    let query = supabase.from("games").select("date");
    if (typeof options.tournamentId === "number") {
      query = query.eq("tournament_id", options.tournamentId);
    }
    const { data, error } = await query.order("date", { ascending: false });
    if (error || !data) {
      console.error("fetchMatchDates supabase error:", error);
      return { dates: [], error: "対局日の取得に失敗しました。Supabase の設定を確認してください。" };
    }

    const rows = data as Array<Record<string, unknown>>;
    const seen = new Set<string>();
    const dates: string[] = [];

    for (const r of rows) {
      const raw = r["date"];
      if (raw === null || raw === undefined) continue;

      let dateStr = "";
      if (typeof raw === "string") {
        dateStr = raw.trim();
      } else {
        try {
          dateStr = new Date(String(raw)).toISOString().slice(0, 10);
        } catch {
          continue;
        }
      }

      if (!dateStr) continue;
      if (!seen.has(dateStr)) {
        seen.add(dateStr);
        dates.push(dateStr);
      }
    }

    return { dates, error: null };
  } catch (err) {
    console.error("fetchMatchDates error:", err);
    return { dates: [], error: "対局日の取得に失敗しました。" };
  }
}