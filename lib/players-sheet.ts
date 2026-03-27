import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

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
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !serviceAccountEmail || !privateKeyRaw) {
    return [...PLAYERS];
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

    const sheet = doc.sheetsByTitle[PLAYER_MASTER_SHEET_TITLE];
    if (!sheet) {
      return [...PLAYERS];
    }

    const rows = await sheet.getRows();
    const names = rows
      .map((row) => String(row.get("name") ?? "").trim())
      .filter(Boolean);

    return names.length > 0 ? names : [...PLAYERS];
  } catch {
    return [...PLAYERS];
  }
}
