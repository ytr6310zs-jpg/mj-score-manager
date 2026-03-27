"use server";

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

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

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  const sheetTitle = process.env.GOOGLE_SHEET_TITLE;

  if (!spreadsheetId || !serviceAccountEmail || !privateKeyRaw) {
    return { success: false, message: "Google Sheets 連携用の環境変数が不足しています。" };
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sheet = sheetTitle ? doc.sheetsByTitle[sheetTitle] : doc.sheetsByIndex[0];

    if (!sheet) {
      return { success: false, message: "指定されたシートが見つかりません。" };
    }

    const rows = await sheet.getRows();
    const targetRow = rows.find((row) => String(row.get("createdAt") ?? "").trim() === createdAt);

    if (!targetRow) {
      return { success: false, message: "対局データが見つかりません。" };
    }

    await targetRow.delete();

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

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  const sheetTitle = process.env.GOOGLE_SHEET_TITLE;

  if (!spreadsheetId || !serviceAccountEmail || !privateKeyRaw) {
    return { success: false, message: "Google Sheets 連携用の環境変数が不足しています。" };
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sheet = sheetTitle ? doc.sheetsByTitle[sheetTitle] : doc.sheetsByIndex[0];

    if (!sheet) {
      return { success: false, message: "指定されたシートが見つかりません。" };
    }

    const rows = await sheet.getRows();
    const targetRow = rows.find((row) => String(row.get("createdAt") ?? "").trim() === createdAt);

    if (!targetRow) {
      return { success: false, message: "対局データが見つかりません。" };
    }

    targetRow.set("date", gameDate);
    targetRow.set("gameType", gameType);
    targetRow.set("playerCount", players.length);
    targetRow.set("scoreTotal", total);
    targetRow.set("topPlayer", topPlayer);
    targetRow.set("lastPlayer", lastPlayer);
    targetRow.set("tobiPlayer", tobiPlayer ?? "");
    targetRow.set("tobashiPlayer", tobashiPlayer ?? "");
    targetRow.set("yakitoriPlayers", [...yakitoriPlayers].join(","));
    targetRow.set("notes", notes);

    for (const entry of entries) {
      targetRow.set(`player${entry.slot}`, entry.player);
      targetRow.set(`score${entry.slot}`, entry.score);
      targetRow.set(`rank${entry.slot}`, entry.rank);
      targetRow.set(`isTobi${entry.slot}`, entry.isTobi);
      targetRow.set(`isTobashi${entry.slot}`, entry.isTobashi);
      targetRow.set(`isYakitori${entry.slot}`, entry.isYakitori);
    }

    if (gameType === "3p") {
      targetRow.set("player4", "");
      targetRow.set("score4", "");
      targetRow.set("rank4", "");
      targetRow.set("isTobi4", false);
      targetRow.set("isTobashi4", false);
      targetRow.set("isYakitori4", false);
    }

    await targetRow.save();

    return { success: true, message: "対局を編集しました。" };
  } catch (error) {
    console.error("Edit match error:", error);
    return { success: false, message: "対局の編集に失敗しました。" };
  }
}
