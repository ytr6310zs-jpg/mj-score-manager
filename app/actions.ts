"use server";

import { insertYakumanOccurrences } from "@/lib/insert-yakuman";
import { buildRankedEntries, validateAndParseMatchForm } from "@/lib/validate-match";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
export type SaveScoreState = {
  success: boolean;
  message: string;
};

export async function saveScoreAction(
  _prevState: SaveScoreState,
  formData: FormData
): Promise<SaveScoreState> {
  const validated = validateAndParseMatchForm(formData);
  if (!validated.ok) {
    return { success: false, message: validated.message };
  }

  const {
    tournamentId,
    gameDate,
    gameType,
    players,
    scores: resolvedScores,
    tobiPlayers,
    tobashiPlayer,
    yakitoriPlayers,
    notes,
    total,
  } = validated.data;

  const entries = buildRankedEntries(players, resolvedScores, yakitoriPlayers, tobiPlayers, tobashiPlayer);
  const rankedEntries = [...entries].sort((left, right) => left.rank - right.rank);
  const topPlayer = rankedEntries[0]?.player ?? "";
  const lastPlayer = rankedEntries[rankedEntries.length - 1]?.player ?? "";

  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { data: tournamentRows, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", tournamentId)
      .limit(1);
    if (tournamentError || !tournamentRows || tournamentRows.length === 0) {
      return { success: false, message: "選択された大会が見つかりません。" };
    }

    // プレイヤー名から players.id を一括解決する
    const allNames = Array.from(new Set([
      ...players,
      ...tobiPlayers,
      ...(tobashiPlayer ? [tobashiPlayer] : []),
      ...[...yakitoriPlayers],
    ]));
    const { data: playerRows, error: playerResolveErr } = await supabase
      .from("players")
      .select("id,name")
      .in("name", allNames);
    if (playerResolveErr) {
      console.error("Player resolve error:", playerResolveErr);
      return { success: false, message: "プレイヤー情報の取得に失敗しました。" };
    }
    const nameToId = new Map<string, number>();
    for (const r of (playerRows ?? []) as Array<{ id: number; name: string }>) {
      nameToId.set(r.name, r.id);
    }

    type RowValue = string | number | boolean | null;

    const row: Record<string, RowValue> = {
      tournament_id: tournamentId,
      date: gameDate,
      game_type: gameType,
      player_count: players.length,
      score_total: total,
      top_player: topPlayer,
      top_player_id: nameToId.get(topPlayer) ?? null,
      last_player: lastPlayer,
      last_player_id: nameToId.get(lastPlayer) ?? null,
      tobi_player: tobiPlayers.length > 0 ? tobiPlayers.join(",") : null,
      tobi_player_id: tobiPlayers.length === 1 ? (nameToId.get(tobiPlayers[0]) ?? null) : null,
      tobashi_player: tobashiPlayer ?? null,
      tobashi_player_id: tobashiPlayer ? (nameToId.get(tobashiPlayer) ?? null) : null,
      yakitori_players: [...yakitoriPlayers].join(","),
      yakitori_player_ids: JSON.stringify(
        [...yakitoriPlayers].map((n) => nameToId.get(n)).filter((id): id is number => id !== undefined)
      ),
      notes,
      created_at: new Date().toISOString(),
    };

    for (const entry of entries) {
      row[`player${entry.slot}`] = entry.player;
      row[`player${entry.slot}_id`] = nameToId.get(entry.player) ?? null;
      row[`score${entry.slot}`] = entry.score;
      row[`rank${entry.slot}`] = entry.rank;
      row[`is_tobi${entry.slot}`] = entry.isTobi;
      row[`is_tobashi${entry.slot}`] = entry.isTobashi;
      row[`is_yakitori${entry.slot}`] = entry.isYakitori;
    }

    if (gameType === "3p") {
      row.player4 = null;
      row.player4_id = null;
      row.score4 = null;
      row.rank4 = null;
      row.is_tobi4 = false;
      row.is_tobashi4 = false;
      row.is_yakitori4 = false;
    }

    const { data: insertedGames, error: insertErr } = await supabase.from("games").insert([row]).select("id");
    if (insertErr || !insertedGames || (Array.isArray(insertedGames) && insertedGames.length === 0)) {
      console.error("Save score insert error:", insertErr);
      return { success: false, message: "データ保存に失敗しました。" };
    }

    const insertedArr = insertedGames as Array<Record<string, unknown>>;
    const newGameId = Number(insertedArr[0]?.id ?? 0);

    // handle yakuman occurrences submitted as a JSON list
    const yakumanSelectionsRaw = String(formData.get("yakumanSelections") ?? "").trim();
    let yakumanSelections: Array<{ playerName: string; yakumanCode: string; yakumanName: string }> = [];

    if (yakumanSelectionsRaw) {
      try {
        const parsed = JSON.parse(yakumanSelectionsRaw) as unknown;
        if (Array.isArray(parsed)) {
          yakumanSelections = parsed
            .map((entry) => {
              const e = entry as Record<string, unknown>;
              return {
                playerName: String(e.playerName ?? "").trim(),
                yakumanCode: String(e.yakumanCode ?? "").trim(),
                yakumanName: String(e.yakumanName ?? "").trim(),
              };
            })
            .filter((entry) => entry.playerName && entry.yakumanCode && entry.yakumanName);
        }
      } catch {
        yakumanSelections = [];
      }
    }

    if (yakumanSelections.length > 0) {
      // delegate to helper (extracted for testability)
      try {
        await insertYakumanOccurrences(supabase, newGameId, yakumanSelectionsRaw);
      } catch (e) {
        console.warn('insertYakumanOccurrences failed', e);
      }
    }

    // revalidate list page
    try {
      revalidatePath("/matches");
    } catch {
      // ignore
    }

    return { success: true, message: "スコアを保存しました。" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "データ保存に失敗しました。" };
  }
}


