"use server";

import { saveScoreAction, type SaveScoreState } from "@/app/actions";
import { canUseScoreInput } from "@/lib/authorization";
import { getCurrentSession } from "@/lib/session";
import {
    buildImportDedupeKey,
    findFuzzyPlayerCandidates,
    parseGameNoFromNotes,
    parseSpreadsheetIdFromUrl,
    parseSpreadsheetMatrix,
} from "@/lib/spreadsheet-import";
import YAKUMANS from "@/lib/yakumans";
import { createClient } from "@supabase/supabase-js";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

type PreviewPayloadRow = {
  rowId: number;
  gameNo: number;
  gameType: "3p" | "4p";
  players: string[];
  matchedPlayers: string[];
  scores: number[];
  yakitoriPlayers: string[];
  tobiPlayers: string[];
  tobashiPlayers: string[];
  conflictingFlagPlayers: string[];
  yakumanSelections: Array<{
    playerName: string;
    yakumanCode: string;
    yakumanName: string;
    points: number | null;
    count: number;
  }>;
};

export type ImportPreviewRow = {
  rowId: number;
  gameNo: number;
  gameType: "3p" | "4p";
  players: string[];
  matchedPlayers: string[];
  total: number;
  duplicate: boolean;
  ready: boolean;
  issues: string[];
  conflictingFlagPlayers: string[];
  fuzzyCandidates: Record<string, string[]>;
};

export type MatchImportPreviewState = {
  success: boolean;
  message: string;
  sheetTitle?: string;
  gameDate?: string;
  rows?: ImportPreviewRow[];
  warnings?: string[];
  payloadJson?: string;
};

export type MatchImportConfirmState = {
  success: boolean;
  message: string;
  importedCount?: number;
  skippedCount?: number;
};

const EMPTY_PREVIEW: MatchImportPreviewState = { success: false, message: "" };
const EMPTY_CONFIRM: MatchImportConfirmState = { success: false, message: "" };

function toTrimmed(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseSelectedIds(raw: string): Set<number> {
  const set = new Set<number>();
  for (const token of raw.split(",").map((v) => v.trim()).filter(Boolean)) {
    const id = Number(token);
    if (Number.isInteger(id) && id >= 0) {
      set.add(id);
    }
  }
  return set;
}

type ConflictResolution = "tobi" | "tobashi";

function parseConflictResolutions(raw: string): Record<string, ConflictResolution> {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const result: Record<string, ConflictResolution> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === "tobi" || value === "tobashi") {
      result[key] = value;
    }
  }
  return result;
}

function resolveGoogleEnv(): { spreadsheetEmail: string; privateKey: string } | null {
  const spreadsheetEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  if (!spreadsheetEmail || !privateKeyRaw) return null;
  return {
    spreadsheetEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

async function loadSheetMatrixByUrl(sheetUrl: string, sheetTitleFromForm: string): Promise<{ matrix: string[][]; sheetTitle: string }> {
  const spreadsheetId = parseSpreadsheetIdFromUrl(sheetUrl);
  if (!spreadsheetId) {
    throw new Error("Google スプレッドシート URL の形式が不正です。");
  }

  const env = resolveGoogleEnv();
  if (!env) {
    throw new Error("Google Sheets 連携用の環境変数が不足しています。");
  }

  const auth = new JWT({
    email: env.spreadsheetEmail,
    key: env.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();

  const sheet = sheetTitleFromForm ? doc.sheetsByTitle[sheetTitleFromForm] : doc.sheetsByIndex[0];
  if (!sheet) {
    throw new Error("対象シートが見つかりません。");
  }

  const matrix = (await sheet.getCellsInRange("A1:ZZ300")) as string[][];
  return { matrix, sheetTitle: sheet.title };
}

async function fetchKnownPlayerNames(supabaseUrl: string, supabaseKey: string): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("players").select("name");
  if (error || !data) {
    throw new Error("プレーヤー一覧の取得に失敗しました。");
  }
  return (data as Array<{ name: string }>).map((row) => row.name.trim()).filter(Boolean);
}

async function fetchExistingImportKeys(
  supabaseUrl: string,
  supabaseKey: string,
  tournamentId: number,
  gameDate: string
): Promise<Set<string>> {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("games")
    .select("tournament_id,date,player1,player2,player3,player4,notes")
    .eq("tournament_id", tournamentId)
    .eq("date", gameDate);

  if (error || !data) {
    throw new Error("重複判定用データの取得に失敗しました。");
  }

  const keys = new Set<string>();
  for (const row of data as Array<Record<string, unknown>>) {
    const gameNo = parseGameNoFromNotes(String(row.notes ?? ""));
    if (!gameNo) continue;
    const players = [row.player1, row.player2, row.player3, row.player4]
      .map((name) => String(name ?? "").trim())
      .filter(Boolean);
    const tid = Number(row.tournament_id ?? 0);
    const date = String(row.date ?? "").trim();
    if (!tid || !date || players.length < 3) continue;
    keys.add(buildImportDedupeKey(tid, date, gameNo, players));
  }
  return keys;
}

function buildPreviewRows(
  knownPlayers: string[],
  gameDate: string,
  tournamentId: number,
  parsedGames: ReturnType<typeof parseSpreadsheetMatrix>["games"],
  existingKeys: Set<string>
): { rows: ImportPreviewRow[]; payloadRows: PreviewPayloadRow[] } {
  const seenKeys = new Set<string>();
  const rows: ImportPreviewRow[] = [];
  const payloadRows: PreviewPayloadRow[] = [];

  parsedGames.forEach((game, index) => {
    const rowId = index;
    const issues: string[] = [];
    const fuzzyCandidates: Record<string, string[]> = {};
    const matchedPlayers: string[] = [];

    for (const playerName of game.players) {
      const exact = knownPlayers.find((name) => name === playerName);
      if (exact) {
        matchedPlayers.push(exact);
        continue;
      }

      const candidates = findFuzzyPlayerCandidates(playerName, knownPlayers);
      fuzzyCandidates[playerName] = candidates;
      issues.push(candidates.length > 0 ? `プレーヤー未一致: ${playerName}` : `プレーヤーが見つかりません: ${playerName}`);
    }

    const total = game.scores.reduce((sum, value) => sum + value, 0);
    if (total !== 0) {
      issues.push(`合計点が 0 ではありません (${total})`);
    }

    const dedupePlayers = matchedPlayers.length === game.players.length ? matchedPlayers : game.players;
    const dedupeKey = buildImportDedupeKey(tournamentId, gameDate, game.gameNo, dedupePlayers);
    const duplicate = existingKeys.has(dedupeKey) || seenKeys.has(dedupeKey);
    if (duplicate) {
      issues.push("重複データのためスキップ対象です");
    }
    seenKeys.add(dedupeKey);

    const ready = issues.length === 0;

    rows.push({
      rowId,
      gameNo: game.gameNo,
      gameType: game.gameType,
      players: game.players,
      matchedPlayers,
      total,
      duplicate,
      ready,
      issues,
      conflictingFlagPlayers: game.conflictingFlagPlayers,
      fuzzyCandidates,
    });

    payloadRows.push({
      rowId,
      gameNo: game.gameNo,
      gameType: game.gameType,
      players: game.players,
      matchedPlayers,
      scores: game.scores,
      yakitoriPlayers: game.yakitoriPlayers,
      tobiPlayers: game.tobiPlayers,
      tobashiPlayers: game.tobashiPlayers,
      conflictingFlagPlayers: game.conflictingFlagPlayers,
      yakumanSelections: game.yakumanSelections,
    });
  });

  return { rows, payloadRows };
}

export async function previewMatchImportAction(
  _prevState: MatchImportPreviewState,
  formData: FormData
): Promise<MatchImportPreviewState> {
  const session = await getCurrentSession();
  if (!session || !canUseScoreInput(session.role)) {
    return { ...EMPTY_PREVIEW, message: "この操作を実行する権限がありません。" };
  }

  const sheetUrl = toTrimmed(formData.get("sheetUrl"));
  const sheetTitle = toTrimmed(formData.get("sheetTitle"));
  const tournamentIdRaw = toTrimmed(formData.get("tournamentId"));
  const gameDateRaw = toTrimmed(formData.get("gameDate"));

  const tournamentId = Number(tournamentIdRaw);
  if (!sheetUrl) {
    return { ...EMPTY_PREVIEW, message: "Google スプレッドシート URL を入力してください。" };
  }
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return { ...EMPTY_PREVIEW, message: "大会を選択してください。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { ...EMPTY_PREVIEW, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  try {
    const loaded = await loadSheetMatrixByUrl(sheetUrl, sheetTitle);
    const parsed = parseSpreadsheetMatrix(loaded.matrix, loaded.sheetTitle, YAKUMANS);

    const gameDate = gameDateRaw || parsed.inferredDate || "";
    if (!gameDate) {
      return {
        ...EMPTY_PREVIEW,
        message: "対局日を特定できません。手入力で対局日を指定してください。",
        sheetTitle: loaded.sheetTitle,
        warnings: parsed.warnings,
      };
    }

    const knownPlayers = await fetchKnownPlayerNames(supabaseUrl, supabaseKey);
    const existingKeys = await fetchExistingImportKeys(supabaseUrl, supabaseKey, tournamentId, gameDate);
    const { rows, payloadRows } = buildPreviewRows(knownPlayers, gameDate, tournamentId, parsed.games, existingKeys);

    if (rows.length === 0) {
      return {
        ...EMPTY_PREVIEW,
        message: "取り込み可能な試合データが見つかりませんでした。",
        sheetTitle: loaded.sheetTitle,
        gameDate,
        warnings: parsed.warnings,
      };
    }

    const payloadJson = JSON.stringify({
      tournamentId,
      gameDate,
      rows: payloadRows,
    });

    const readyCount = rows.filter((row) => row.ready).length;
    return {
      success: true,
      message: `プレビューを作成しました（${readyCount}/${rows.length} 行が取り込み可能）。`,
      sheetTitle: loaded.sheetTitle,
      gameDate,
      rows,
      warnings: parsed.warnings,
      payloadJson,
    };
  } catch (error) {
    console.error("previewMatchImportAction error:", error);
    return { ...EMPTY_PREVIEW, message: "プレビューの作成に失敗しました。URL と権限設定を確認してください。" };
  }
}

function mapNames(source: string[], rawPlayers: string[], matchedPlayers: string[]): string[] {
  const mapped: string[] = [];
  for (const name of source) {
    const index = rawPlayers.indexOf(name);
    if (index >= 0 && matchedPlayers[index]) {
      mapped.push(matchedPlayers[index]);
    }
  }
  return mapped;
}

export async function confirmMatchImportAction(
  _prevState: MatchImportConfirmState,
  formData: FormData
): Promise<MatchImportConfirmState> {
  const session = await getCurrentSession();
  if (!session || !canUseScoreInput(session.role)) {
    return { ...EMPTY_CONFIRM, message: "この操作を実行する権限がありません。" };
  }

  const payloadRaw = toTrimmed(formData.get("payloadJson"));
  const selectedRaw = toTrimmed(formData.get("selectedRowIds"));
  const resolutionRaw = toTrimmed(formData.get("conflictResolutionJson"));
  if (!payloadRaw) {
    return { ...EMPTY_CONFIRM, message: "プレビュー情報が見つかりません。再度プレビューを作成してください。" };
  }

  const selectedIds = parseSelectedIds(selectedRaw);
  const conflictResolutions = parseConflictResolutions(resolutionRaw);
  if (selectedIds.size === 0) {
    return { ...EMPTY_CONFIRM, message: "取り込み対象の行を 1 つ以上選択してください。" };
  }

  let payload: { tournamentId: number; gameDate: string; rows: PreviewPayloadRow[] };
  try {
    payload = JSON.parse(payloadRaw) as { tournamentId: number; gameDate: string; rows: PreviewPayloadRow[] };
  } catch {
    return { ...EMPTY_CONFIRM, message: "プレビュー情報の形式が不正です。" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { ...EMPTY_CONFIRM, message: "Supabase 連携用の環境変数が不足しています。" };
  }

  try {
    const existingKeys = await fetchExistingImportKeys(supabaseUrl, supabaseKey, payload.tournamentId, payload.gameDate);
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of payload.rows) {
      if (!selectedIds.has(row.rowId)) {
        skippedCount += 1;
        continue;
      }

      if (row.players.length !== row.matchedPlayers.length) {
        skippedCount += 1;
        continue;
      }

      const dedupeKey = buildImportDedupeKey(payload.tournamentId, payload.gameDate, row.gameNo, row.matchedPlayers);
      if (existingKeys.has(dedupeKey)) {
        skippedCount += 1;
        continue;
      }

      const resolvedTobiPlayers = [...row.tobiPlayers];
      const resolvedTobashiPlayers = [...row.tobashiPlayers];

      let hasUnresolvedConflict = false;
      for (const playerName of row.conflictingFlagPlayers) {
        const resolution = conflictResolutions[`${row.rowId}:${playerName}`];
        if (!resolution) {
          hasUnresolvedConflict = true;
          break;
        }

        const tobiIndex = resolvedTobiPlayers.indexOf(playerName);
        if (tobiIndex >= 0) resolvedTobiPlayers.splice(tobiIndex, 1);
        const tobashiIndex = resolvedTobashiPlayers.indexOf(playerName);
        if (tobashiIndex >= 0) resolvedTobashiPlayers.splice(tobashiIndex, 1);

        if (resolution === "tobi") {
          resolvedTobiPlayers.push(playerName);
        } else {
          resolvedTobashiPlayers.push(playerName);
        }
      }

      if (hasUnresolvedConflict) {
        skippedCount += 1;
        continue;
      }

      const fd = new FormData();
      fd.append("tournamentId", String(payload.tournamentId));
      fd.append("gameDate", payload.gameDate);
      fd.append("gameType", row.gameType);

      row.matchedPlayers.forEach((name, idx) => {
        const slot = idx + 1;
        fd.append(`player${slot}`, name);
        fd.append(`score${slot}`, String(row.scores[idx] ?? 0));
      });

      mapNames(row.yakitoriPlayers, row.players, row.matchedPlayers).forEach((name) => {
        const idx = row.matchedPlayers.indexOf(name);
        if (idx >= 0) fd.append(`yakitori${idx + 1}`, "on");
      });

      fd.append("tobiPlayers", mapNames(resolvedTobiPlayers, row.players, row.matchedPlayers).join(","));
      fd.append("tobashiPlayers", JSON.stringify(mapNames(resolvedTobashiPlayers, row.players, row.matchedPlayers)));
      fd.append("notes", `SPREADSHEET_IMPORT gameNo=${row.gameNo}`);

      const normalizedYakuman = row.yakumanSelections
        .map((entry) => {
          const idx = row.players.indexOf(entry.playerName);
          if (idx < 0) return null;
          const mappedPlayer = row.matchedPlayers[idx];
          return mappedPlayer
            ? {
                ...entry,
                playerName: mappedPlayer,
              }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (normalizedYakuman.length > 0) {
        fd.append("yakumanSelections", JSON.stringify(normalizedYakuman));
      }

      const result: SaveScoreState = await saveScoreAction({ success: false, message: "" }, fd);
      if (!result.success) {
        skippedCount += 1;
        continue;
      }

      existingKeys.add(dedupeKey);
      importedCount += 1;
    }

    return {
      success: importedCount > 0,
      message:
        importedCount > 0
          ? `取り込み完了: ${importedCount} 行を保存しました（${skippedCount} 行をスキップ）。`
          : `取り込み対象を保存できませんでした（${skippedCount} 行をスキップ）。`,
      importedCount,
      skippedCount,
    };
  } catch (error) {
    console.error("confirmMatchImportAction error:", error);
    return { ...EMPTY_CONFIRM, message: "インポート確定に失敗しました。" };
  }
}
