"use server";

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

const NONE_VALUE = "__none__";
const SCORE_TOLERANCE = 1;

type GameType = "3p" | "4p";

function parseGameType(value: FormDataEntryValue | null): GameType {
  return value === "4p" ? "4p" : "3p";
}

function parseString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseOptionalPlayer(value: FormDataEntryValue | null) {
  const parsed = parseString(value);
  return !parsed || parsed === NONE_VALUE ? null : parsed;
}

function parseScore(value: FormDataEntryValue | null) {
  const raw = parseString(value);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < -1000 || parsed > 1000) {
    return null;
  }

  return parsed;
}

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

function validatePlayer(name: string, label: string) {
  if (!name) {
    return `${label}を選択してください`;
  }

  return null;
}

function buildRankedEntries(
  players: string[],
  scores: number[],
  yakitoriPlayers: Set<string>,
  tobiPlayer: string | null,
  tobashiPlayer: string | null
) {
  const ranked = players
    .map((player, index) => ({
      slot: index + 1,
      player,
      score: scores[index],
    }))
    .sort((left, right) => right.score - left.score || left.slot - right.slot)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const rankBySlot = new Map(ranked.map((entry) => [entry.slot, entry.rank]));

  return players.map((player, index) => ({
    slot: index + 1,
    player,
    score: scores[index],
    rank: rankBySlot.get(index + 1) ?? players.length,
    isTobi: tobiPlayer === player,
    isTobashi: tobashiPlayer === player,
    isYakitori: yakitoriPlayers.has(player),
  }));
}

export async function editMatchAction(
  _prevState: EditMatchState | undefined,
  formData: FormData
): Promise<EditMatchState> {
  const createdAt = String(formData.get("createdAt") ?? "").trim();

  if (!createdAt) {
    return { success: false, message: "対局IDが不正です。" };
  }

  const gameDate = parseString(formData.get("gameDate"));
  if (!gameDate) {
    return { success: false, message: "対局日を入力してください" };
  }

  const gameType = parseGameType(formData.get("gameType"));
  const activeSlots = gameType === "4p" ? [1, 2, 3, 4] : [1, 2, 3];

  const players = activeSlots.map((slot) => parseString(formData.get(`player${slot}`)));
  for (const [index, player] of players.entries()) {
    const error = validatePlayer(player, `プレイヤー${index + 1}`);
    if (error) {
      return { success: false, message: error };
    }
  }

  if (new Set(players).size !== players.length) {
    return {
      success: false,
      message: `${gameType === "4p" ? "4名" : "3名"}とも別の名前を選択してください。`,
    };
  }

  const scores = activeSlots.map((slot, index) => {
    const score = parseScore(formData.get(`score${slot}`));
    return {
      index,
      score,
    };
  });

  const invalidScore = scores.find(({ score }) => score === null);
  if (invalidScore) {
    return {
      success: false,
      message: `スコア${invalidScore.index + 1}は -1000 から 1000 の整数で入力してください。`,
    };
  }

  const resolvedScores = scores.map(({ score }) => score as number);
  const total = resolvedScores.reduce((sum, score) => sum + score, 0);

  if (Math.abs(total) > SCORE_TOLERANCE) {
    return {
      success: false,
      message: "最終スコア合計は 0 にしてください。四捨五入の記載誤差として ±1 までは許容しています。",
    };
  }

  const tobiPlayer = parseOptionalPlayer(formData.get("tobiPlayer"));
  const tobashiPlayer = parseOptionalPlayer(formData.get("tobashiPlayer"));
  const yakitoriPlayers = new Set(
    activeSlots
      .filter((slot) => formData.get(`yakitori${slot}`) === "on")
      .map((slot, index) => players[index])
      .filter(Boolean)
  );

  if ((tobiPlayer && !tobashiPlayer) || (!tobiPlayer && tobashiPlayer)) {
    return {
      success: false,
      message: "飛びと飛ばしは両方セットで指定してください。",
    };
  }

  if (tobiPlayer && !players.includes(tobiPlayer)) {
    return {
      success: false,
      message: "飛び対象は同卓プレイヤーから選択してください。",
    };
  }

  if (tobashiPlayer && !players.includes(tobashiPlayer)) {
    return {
      success: false,
      message: "飛ばし者は同卓プレイヤーから選択してください。",
    };
  }

  if (tobiPlayer && tobashiPlayer && tobiPlayer === tobashiPlayer) {
    return {
      success: false,
      message: "飛び対象と飛ばし者に同じプレイヤーは指定できません。",
    };
  }

  const entries = buildRankedEntries(players, resolvedScores, yakitoriPlayers, tobiPlayer, tobashiPlayer);
  const rankedEntries = [...entries].sort((left, right) => left.rank - right.rank);
  const topPlayer = rankedEntries[0]?.player ?? "";
  const lastPlayer = rankedEntries[rankedEntries.length - 1]?.player ?? "";

  const notes = parseString(formData.get("notes"));
  const yakumanSelections = parseYakumanSelections(formData.get("yakumanSelections"));

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    // プレイヤー名から players.id を一括解決する
    const allNames = Array.from(new Set([
      ...players,
      ...(tobiPlayer ? [tobiPlayer] : []),
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
      date: gameDate,
      game_type: gameType,
      player_count: players.length,
      score_total: total,
      top_player: topPlayer,
      top_player_id: nameToId.get(topPlayer) ?? null,
      last_player: lastPlayer,
      last_player_id: nameToId.get(lastPlayer) ?? null,
      tobi_player: tobiPlayer ?? null,
      tobi_player_id: tobiPlayer ? (nameToId.get(tobiPlayer) ?? null) : null,
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
