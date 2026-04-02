"use server";

import { createClient } from "@supabase/supabase-js";

export type YakumanActionState = {
  success: boolean;
  message: string;
};

function parseString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function addYakumanAction(
  _prev: YakumanActionState | undefined,
  formData: FormData
): Promise<YakumanActionState> {
  const createdAt = parseString(formData.get("createdAt"));
  const playerName = parseString(formData.get("playerName"));
  const yakumanCode = parseString(formData.get("yakumanCode"));
  const yakumanName = parseString(formData.get("yakumanName"));
  const pointsRaw = parseString(formData.get("points"));

  if (!createdAt || !playerName || !yakumanCode || !yakumanName) {
    return { success: false, message: "必要なフィールドが不足しています。" };
  }

  const points = pointsRaw ? Number(pointsRaw) : null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    // resolve game id by created_at
    const { data: games, error: gerr } = await supabase.from("games").select("id").eq("created_at", createdAt).limit(1);
    if (gerr) {
      console.error("resolve game id error:", gerr);
      return { success: false, message: "対局の特定に失敗しました。" };
    }
    if (!games || games.length === 0) {
      return { success: false, message: "該当する対局が見つかりません。" };
    }
    const gameId = (games as { id: number }[])[0].id as number;

    // resolve player id by name
    const { data: players, error: perr } = await supabase.from("players").select("id").eq("name", playerName).limit(1);
    if (perr) {
      console.error("resolve player id error:", perr);
      return { success: false, message: "プレイヤーの特定に失敗しました。" };
    }
    if (!players || players.length === 0) {
      return { success: false, message: "該当するプレイヤーが見つかりません。" };
    }
    const playerId = (players as { id: number }[])[0].id as number;

    const insertPayload: Record<string, unknown> = {
      game_id: gameId,
      player_id: playerId,
      yakuman_code: yakumanCode,
      yakuman_name: yakumanName,
      points: points ?? null,
      meta: null,
    };

    const { error: ierr } = await supabase.from("yakuman_occurrences").insert([insertPayload]);
    if (ierr) {
      console.error("insert yakuman error:", ierr);
      return { success: false, message: "役満情報の登録に失敗しました。" };
    }

    return { success: true, message: "役満を登録しました。" };
  } catch (error) {
    console.error("addYakumanAction error:", error);
    return { success: false, message: "役満情報の登録に失敗しました。" };
  }
}

export async function deleteYakumanAction(
  _prev: YakumanActionState | undefined,
  formData: FormData
): Promise<YakumanActionState> {
  const idRaw = parseString(formData.get("id"));
  const id = idRaw ? Number(idRaw) : NaN;

  if (Number.isNaN(id)) {
    return { success: false, message: "無効なIDです。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { error } = await supabase.from("yakuman_occurrences").delete().eq("id", id).limit(1);
    if (error) {
      console.error("delete yakuman error:", error);
      return { success: false, message: "役満情報の削除に失敗しました。" };
    }
    return { success: true, message: "役満を削除しました。" };
  } catch (error) {
    console.error("deleteYakumanAction error:", error);
    return { success: false, message: "役満情報の削除に失敗しました。" };
  }
}
