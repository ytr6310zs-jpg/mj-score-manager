"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
const NONE_VALUE = "__none__";
const SCORE_TOLERANCE = 1;

type GameType = "3p" | "4p";

type GameEntry = {
  slot: number;
  player: string;
  score: number;
  rank: number;
  isTobi: boolean;
  isTobashi: boolean;
  isYakitori: boolean;
};

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
  })) satisfies GameEntry[];
}

export type SaveScoreState = {
  success: boolean;
  message: string;
};

export async function saveScoreAction(
  _prevState: SaveScoreState,
  formData: FormData
): Promise<SaveScoreState> {
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

  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    type RowValue = string | number | boolean | null;

    const row: Record<string, RowValue> = {
      date: gameDate,
      game_type: gameType,
      player_count: players.length,
      score_total: total,
      top_player: topPlayer,
      last_player: lastPlayer,
      tobi_player: tobiPlayer ?? null,
      tobashi_player: tobashiPlayer ?? null,
      yakitori_players: [...yakitoriPlayers].join(","),
      notes,
      created_at: new Date().toISOString(),
    };

    for (const entry of entries) {
      row[`player${entry.slot}`] = entry.player;
      row[`score${entry.slot}`] = entry.score;
      row[`rank${entry.slot}`] = entry.rank;
      row[`is_tobi${entry.slot}`] = entry.isTobi;
      row[`is_tobashi${entry.slot}`] = entry.isTobashi;
      row[`is_yakitori${entry.slot}`] = entry.isYakitori;
    }

    if (gameType === "3p") {
      row.player4 = null;
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
    const yakRows: Array<Record<string, unknown>> = [];
    const yakumanSelectionsRaw = parseString(formData.get("yakumanSelections"));
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
      const namesToResolve = new Set(yakumanSelections.map((entry) => entry.playerName));
      const namesArr = Array.from(namesToResolve);
      const { data: playersRows, error: playersErr } = await supabase.from("players").select("id,name").in("name", namesArr);
      if (!playersErr && playersRows && Array.isArray(playersRows)) {
        const nameToId = new Map<string, number>();
        for (const r of playersRows) {
          const nm = String(r["name"] ?? "");
          const id = Number((r as Record<string, unknown>)["id"] ?? 0);
          if (nm) nameToId.set(nm, id);
        }

        for (const entry of yakumanSelections) {
          const pid = nameToId.get(entry.playerName);
          if (!pid) {
            console.warn("player id not found for yakuman insertion:", entry.playerName);
            continue;
          }
          yakRows.push({
            game_id: newGameId,
            player_id: pid,
            yakuman_code: entry.yakumanCode,
            yakuman_name: entry.yakumanName,
            points: null,
            meta: null,
          });
        }
      }

      if (yakRows.length > 0) {
        const { error: yakInsertErr } = await supabase.from("yakuman_occurrences").insert(yakRows);
        if (yakInsertErr) {
          console.error("yakuman insert error:", yakInsertErr);
          // non-fatal: still return success for game insert, but log
        }
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
