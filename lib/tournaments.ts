import { createClient } from "@supabase/supabase-js";

export type TournamentRow = {
  id: number;
  name: string;
  created_at: string | null;
};

export type TournamentOption = {
  id: number;
  name: string;
};

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

function mapTournamentRow(row: Record<string, unknown>): TournamentRow {
  return {
    id: Number(row.id ?? 0),
    name: String(row.name ?? ""),
    created_at: row.created_at ? String(row.created_at) : null,
  };
}

export async function fetchTournaments(): Promise<TournamentRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,name,created_at")
      .order("id", { ascending: true });
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map(mapTournamentRow);
  } catch {
    return [];
  }
}

export async function fetchTournamentOptions(): Promise<TournamentOption[]> {
  const rows = await fetchTournaments();
  return rows.map(({ id, name }) => ({ id, name }));
}

export async function fetchTournamentById(id: number): Promise<TournamentRow | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,name,created_at")
      .eq("id", id)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return mapTournamentRow((data as Array<Record<string, unknown>>)[0]);
  } catch {
    return null;
  }
}

export async function fetchDefaultTournament(): Promise<TournamentRow | null> {
  const tournaments = await fetchTournaments();
  if (tournaments.length === 0) return null;

  const preferred = tournaments.find((tournament) => tournament.name === "大会1");
  return preferred ?? tournaments[0];
}

export async function countGamesByTournamentId(id: number): Promise<number> {
  if (!Number.isInteger(id) || id <= 0) return 0;

  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id);
    if (error) return 0;
    return Number(count ?? 0);
  } catch {
    return 0;
  }
}