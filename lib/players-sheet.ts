import { createClient } from "@supabase/supabase-js";

import { PLAYERS } from "@/lib/players";

export const PLAYER_MASTER_SHEET_TITLE = "プレイヤーマスタ";

/**
 * Google Sheets の "プレイヤーマスタ" シートからプレイヤー名一覧を取得する。
 * シートが存在しない・取得失敗時は lib/players.ts の静的リストにフォールバックする。
 *
 * シート構造:
 *   ヘッダー行: name
 *   データ行: 各プレイヤーの名前（1行1名）
 */
export async function fetchPlayerNames(): Promise<string[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [...PLAYERS];
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { data, error } = await supabase.from("players").select("name").order("id", { ascending: true });
    if (error || !data) return [...PLAYERS];

    const rows = data as Array<{ name?: unknown }>;
    const names = rows.map((r) => String(r.name ?? "").trim()).filter(Boolean);
    return names.length > 0 ? names : [...PLAYERS];
  } catch {
    return [...PLAYERS];
  }
}
