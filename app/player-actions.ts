"use server";

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

import { PLAYER_MASTER_SHEET_TITLE } from "@/lib/players-sheet";

export type AddPlayerState = {
  success: boolean;
  message: string;
  name?: string;
};

export async function addPlayerAction(
  _prevState: AddPlayerState | undefined,
  formData: FormData
): Promise<AddPlayerState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { success: false, message: "名前を入力してください。" };
  }
  if (name.length > 20) {
    return { success: false, message: "名前は20文字以内で入力してください。" };
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

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

    let sheet = doc.sheetsByTitle[PLAYER_MASTER_SHEET_TITLE];

    if (!sheet) {
      sheet = await doc.addSheet({
        title: PLAYER_MASTER_SHEET_TITLE,
        headerValues: ["name"],
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.map((row) => String(row.get("name") ?? "").trim());

    if (existing.includes(name)) {
      return { success: false, message: `「${name}」はすでに登録されています。` };
    }

    await sheet.addRow({ name });

    return { success: true, message: `「${name}」を追加しました。`, name };
  } catch {
    return { success: false, message: "プレイヤーの追加に失敗しました。" };
  }
}
