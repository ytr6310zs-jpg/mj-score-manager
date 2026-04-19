"use server";

import { buildRankedEntries, validateAndParseMatchForm } from "@/lib/validate-match";
import { createClient } from "@supabase/supabase-js";
export type DeleteMatchState = {
  success: boolean;
  message: string;
};

export async function deleteMatchAction(
  _prevState: DeleteMatchState | undefined,
  formData: FormData
): Promise<DeleteMatchState> {
  const createdAt = String(formData.get("createdAt") ?? "").trim();

  if (!createdAt) {
    return { success: false, message: "対局IDが不正です。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const { error } = await supabase.from("games").delete().eq("created_at", createdAt).limit(1);
    if (error) {
      console.error("Delete match error:", error);
      return { success: false, message: "対局の削除に失敗しました。" };
    }

    return { success: true, message: "対局を削除しました。" };
  } catch (error) {
    console.error("Delete match error:", error);
    return { success: false, message: "対局の削除に失敗しました。" };
  }
}

export type EditMatchState = {
  success: boolean;
  message: string;
};
type YakumanSelection = {
  playerName: string;
  yakumanCode: string;
  yakumanName: string;
  points: number | null;
};

function parseYakumanSelections(value: FormDataEntryValue | null): YakumanSelection[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const row = item as Record<string, unknown>;
        const playerName = String(row.playerName ?? "").trim();
        const yakumanCode = String(row.yakumanCode ?? "").trim();
        const yakumanName = String(row.yakumanName ?? "").trim();
        const pointsRaw = row.points;

        let points: number | null = null;
        if (pointsRaw !== null && pointsRaw !== undefined && String(pointsRaw).trim() !== "") {
          const parsedPoints = Number(pointsRaw);
          points = Number.isFinite(parsedPoints) ? parsedPoints : null;
        }

        return { playerName, yakumanCode, yakumanName, points };
      })
      .filter((item) => item.playerName && item.yakumanCode && item.yakumanName);
  } catch {
    return [];
  }
}

export async function editMatchAction(
  _prevState: EditMatchState | undefined,
  formData: FormData
): Promise<EditMatchState> {
  const createdAt = String(formData.get("createdAt") ?? "").trim();

  if (!createdAt) {
    return { success: false, message: "対局IDが不正です。" };
  }

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

  const yakumanSelections = parseYakumanSelections(formData.get("yakumanSelections"));

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

    const updatePayload: Record<string, RowValue> = {
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
    };

    for (const entry of entries) {
      updatePayload[`player${entry.slot}`] = entry.player;
      updatePayload[`player${entry.slot}_id`] = nameToId.get(entry.player) ?? null;
      updatePayload[`score${entry.slot}`] = entry.score;
      updatePayload[`rank${entry.slot}`] = entry.rank;
      updatePayload[`is_tobi${entry.slot}`] = entry.isTobi;
      updatePayload[`is_tobashi${entry.slot}`] = entry.isTobashi;
      updatePayload[`is_yakitori${entry.slot}`] = entry.isYakitori;
    }

    if (gameType === "3p") {
      updatePayload.player4 = null;
      updatePayload.player4_id = null;
      updatePayload.score4 = null;
      updatePayload.rank4 = null;
      updatePayload.is_tobi4 = false;
      updatePayload.is_tobashi4 = false;
      updatePayload.is_yakitori4 = false;
    }

    const { error } = await supabase.from("games").update(updatePayload).eq("created_at", createdAt).limit(1);
    if (error) {
      console.error("Edit match error:", error);
      return { success: false, message: "対局の編集に失敗しました。" };
    }

    const { data: gameRows, error: gameIdError } = await supabase
      .from("games")
      .select("id")
      .eq("created_at", createdAt)
      .limit(1);

    if (gameIdError) {
      console.error("Edit match yakuman game lookup error:", gameIdError);
      return { success: false, message: "役満情報の保存に失敗しました。" };
    }

    const gameId = gameRows && gameRows.length > 0 ? Number(gameRows[0].id) : null;
    if (!gameId) {
      return { success: false, message: "役満情報の保存に失敗しました。" };
    }

    const yakumanPlayerRows = await supabase.from("players").select("id,name").in("name", players);
    if (yakumanPlayerRows.error || !yakumanPlayerRows.data) {
      console.error("Edit match yakuman player lookup error:", yakumanPlayerRows.error);
      return { success: false, message: "役満情報の保存に失敗しました。" };
    }

    const playerIdByName = new Map(
      yakumanPlayerRows.data.map((row) => [String(row.name), Number(row.id)])
    );

    const deleteYakumanRes = await supabase.from("yakuman_occurrences").delete().eq("game_id", gameId);
    if (deleteYakumanRes.error) {
      console.error("Edit match yakuman delete error:", deleteYakumanRes.error);
      return { success: false, message: "役満情報の保存に失敗しました。" };
    }

    if (yakumanSelections.length > 0) {
      const insertRows = yakumanSelections
        .map((selection) => {
          const playerId = playerIdByName.get(selection.playerName);
          if (!playerId) return null;
          return {
            game_id: gameId,
            player_id: playerId,
            yakuman_code: selection.yakumanCode,
            yakuman_name: selection.yakumanName,
            points: selection.points,
          };
        })
        .filter((row): row is { game_id: number; player_id: number; yakuman_code: string; yakuman_name: string; points: number | null } => row !== null);

      if (insertRows.length > 0) {
        const insertYakumanRes = await supabase.from("yakuman_occurrences").insert(insertRows);
        if (insertYakumanRes.error) {
          console.error("Edit match yakuman insert error:", insertYakumanRes.error);
          return { success: false, message: "役満情報の保存に失敗しました。" };
        }
      }
    }

    return { success: true, message: "対局を編集しました。" };
  } catch (error) {
    console.error("Edit match error:", error);
    return { success: false, message: "対局の編集に失敗しました。" };
  }
}
